import { useMemo, useState, useEffect } from 'react'

const useTrainer = ({ workoutRecords, planItems }) => {
  const [aiSuggestions, setAiSuggestions] = useState({})
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [useAI, setUseAI] = useState(true) // AI を使うかどうかのフラグ

  // ルールベースの計算（フォールバック用）
  const ruleSuggestions = useMemo(() => {
    const suggestions = {}

    planItems?.forEach((item) => {
      const exerciseName = item.title
      const records = workoutRecords[exerciseName] || []

      if (records.length === 0) return

      // 記録を日付順（降順＝新しい順）でソート
      const sortedRecords = [...records].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )

      const latest = sortedRecords[0]
      if (!latest?.weight) return

      // 過去3-5回の重量推移を分析
      const recentRecords = sortedRecords.slice(0, 5)
      const weights = recentRecords
        .map((r) => parseFloat(r.weight))
        .filter((w) => !isNaN(w))

      if (weights.length === 0) return

      // トレンド判定ロジック
      const latestWeight = weights[0]
      const avgPreviousWeight =
        weights.slice(1).reduce((a, b) => a + b, 0) / (weights.length - 1)

      let nextWeight = latestWeight
      let nextReps = latest.reps || 8  // 記録されたrep数を優先
      let nextSets = latest.sets || 3  // 記録されたset数を優先
      let reasoning = ''

      if (weights.length >= 2) {
        const weightDiff = latestWeight - avgPreviousWeight
        // 増加傾向：+2.5kg を試す
        if (weightDiff > 0.5) {
          nextWeight = latestWeight + 2.5
          // 重くなるので rep は減らす提案
          if (nextReps > 3) {
            nextReps = Math.max(3, nextReps - 2)
          }
          reasoning = `直近が${latestWeight}kg、増加傾向。${nextWeight}kg × ${nextReps}回を試してみます`
        }
        // 停滞：同じ重量で回数を増やす提案
        else if (Math.abs(weightDiff) <= 0.5) {
          nextWeight = latestWeight
          nextReps = Math.min(12, (nextReps || 8) + 1)
          reasoning = `${latestWeight}kgで停滞中。回数を${nextReps}回に増やそう`
        }
        // 低下傾向：前の重量に戻す
        else {
          nextWeight = latestWeight - 1.25
          reasoning = `${latestWeight}kgで低下。${nextWeight}kgに調整`
        }
      } else {
        reasoning = `最新記録：${latestWeight}kg。${nextReps}回 × ${nextSets}セット`
      }

      suggestions[exerciseName] = {
        exerciseName,
        lastWeight: latestWeight,
        lastReps: latest.reps,
        lastSets: latest.sets,
        nextWeight: parseFloat(nextWeight.toFixed(2)),
        nextReps: parseInt(nextReps),
        nextSets: parseInt(nextSets),
        reasoning,
        timestamp: new Date().toISOString(),
      }
    })

    return suggestions
  }, [workoutRecords, planItems])

  // AI による提案を取得
  useEffect(() => {
    if (!useAI || !planItems || planItems.length === 0) return

    const fetchAISuggestions = async () => {
      setIsLoadingAI(true)
      const newSuggestions = {}

      for (const item of planItems) {
        const exerciseName = item.title
        const records = workoutRecords[exerciseName] || []

        if (records.length === 0) continue

        try {
          const response = await fetch('/api/trainer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: records.slice(0, 5),
              exerciseName,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              newSuggestions[exerciseName] = {
                ...data.suggestion,
                lastWeight: records[0]?.weight,
                lastReps: records[0]?.reps,
                lastSets: records[0]?.sets,
              }
            }
          }
        } catch (error) {
          console.error(`AI suggestion failed for ${exerciseName}:`, error)
        }
      }

      setAiSuggestions(newSuggestions)
      setIsLoadingAI(false)
    }

    fetchAISuggestions()
  }, [workoutRecords, planItems, useAI])

  // AI または ルールベースの提案を返す
  const trainerSuggestions = useMemo(() => {
    if (useAI && Object.keys(aiSuggestions).length > 0) {
      return aiSuggestions
    }
    return ruleSuggestions
  }, [useAI, aiSuggestions, ruleSuggestions])

  // 特定の種目の提案を取得
  const getTrainerSuggestion = (exerciseName) => {
    return trainerSuggestions[exerciseName] || null
  }

  // 本日のプランで提案がある種目のリスト
  const suggestedExercises = useMemo(() => {
    return planItems
      ?.filter((item) => trainerSuggestions[item.title])
      .map((item) => ({
        ...item,
        suggestion: trainerSuggestions[item.title],
      }))
  }, [planItems, trainerSuggestions])

  return {
    trainerSuggestions,
    getTrainerSuggestion,
    suggestedExercises,
    isLoadingAI,
    useAI,
    setUseAI,
  }
}

export default useTrainer
