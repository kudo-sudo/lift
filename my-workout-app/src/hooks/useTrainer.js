import { useMemo, useState, useEffect } from 'react'

const useTrainer = ({ workoutRecords, planItems, planDate, aiSupportTargets }) => {
  const [aiSuggestions, setAiSuggestions] = useState({})
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [useAI, setUseAI] = useState(true) // AI を使うかどうかのフラグ
  const aiAddedExercises = useMemo(
    () => new Set(planItems?.filter((item) => item.source === 'ai').map((item) => item.title)),
    [planItems]
  )

  // プレート最小化ロジック
  const getPlateCombo = (weight) => {
    const bar = 20
    const loadPerSide = (weight - bar) / 2
    if (loadPerSide < 0) return { error: true }
    
    const plates = {}
    const availablePlates = [20, 10, 5, 2.5, 1.25]
    let remaining = loadPerSide
    
    availablePlates.forEach((p) => {
      plates[p] = Math.floor(remaining / p)
      remaining -= plates[p] * p
    })
    
    return { barWeight: bar, loadPerSide, plates, total: weight }
  }

  // プレート操作数を計算（付け外し回数）
  const countPlateOperations = (combo1, combo2) => {
    if (combo1.error || combo2.error) return Infinity
    const allPlates = new Set([
      ...Object.keys(combo1.plates),
      ...Object.keys(combo2.plates),
    ])
    let ops = 0
    allPlates.forEach((p) => {
      const c1 = parseFloat(combo1.plates[p]) || 0
      const c2 = parseFloat(combo2.plates[p]) || 0
      if (c1 !== c2) {
        ops += Math.abs(c2 - c1)
      }
    })
    return ops
  }

  // メイン重量から候補を「プレート操作が少ない」順に返す
  const findOptimalWeights = (mainWeight, candidates) => {
    const mainCombo = getPlateCombo(mainWeight)
    if (mainCombo.error) return candidates
    
    return candidates
      .map((w) => ({
        weight: w,
        operations: countPlateOperations(mainCombo, getPlateCombo(w)),
      }))
      .filter((item) => item.operations !== Infinity)
      .sort((a, b) => a.operations - b.operations)
      .map((item) => item.weight)
  }

  // ============ Bench Press Workout Generation Engine ============
  // Strict rule-based progression system
  
  const roundToPlate = (weight) => {
    return Math.round(weight / 2.5) * 2.5
  }

  const estimateOneRM = (weight, reps) => {
    if (reps === 1) return weight
    return weight * (1 + reps / 30)
  }

  const calculateTonnage = (tiers) => {
    let total = 0
    if (tiers.neural) {
      total += (tiers.neural.weight || 0) * (tiers.neural.reps || 1) * (tiers.neural.sets || 1)
    }
    if (tiers.strength) {
      total += (tiers.strength.weight || 0) * (tiers.strength.reps || 1) * (tiers.strength.sets || 1)
    }
    if (tiers.volume) {
      total += (tiers.volume.weight || 0) * (tiers.volume.reps || 1) * (tiers.volume.sets || 1)
    }
    return total
  }

  const getConsecutiveMetrics = (records, latestWeight) => {
    if (records.length < 2) return { success: 0, failure: 0 }
    
    let successCount = 0
    let failureCount = 0
    
    for (let i = 0; i < records.length - 1; i++) {
      const curr = parseFloat(records[i].weight) || 0
      const prev = parseFloat(records[i + 1].weight) || 0
      if (curr > prev) {
        successCount++
        failureCount = 0
      } else if (curr < prev) {
        failureCount++
        successCount = 0
      }
    }
    
    return { success: successCount, failure: failureCount }
  }

  const getPreviousTonnage = (records) => {
    if (records.length === 0) return 0
    let total = 0
    records.slice(0, 3).forEach((r) => {
      const w = parseFloat(r.weight) || 0
      const reps = parseInt(r.reps) || 5
      const sets = parseInt(r.sets) || 3
      total += w * reps * sets
    })
    return total / Math.min(3, records.length)
  }

  const estimateFatigue = (records) => {
    // 簡易版：直近3日の回数合計で判定
    if (records.length === 0) return 1
    let totalReps = 0
    records.slice(0, 3).forEach((r) => {
      totalReps += (parseInt(r.reps) || 5) * (parseInt(r.sets) || 3)
    })
    // 高回数 = 疲労高い
    if (totalReps > 60) return 8
    if (totalReps > 40) return 6
    return 3
  }

  const estimateDepth = (record) => {
    const memo = (record.memo || '').toLowerCase()
    if (memo.includes('shallow') || memo.includes('浅い') || memo.includes('partial')) {
      return 'shallow'
    }
    return 'normal'
  }

  const generateOptimalWorkout = (records, exerciseName) => {
    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )
    
    if (sortedRecords.length === 0) {
      return null
    }

    const latest = sortedRecords[0]
    const topSetWeight = parseFloat(latest.weight) || 0
    const topSetReps = parseInt(latest.reps) || 5

    // === INPUT PARAMETERS ===
    const topSet = { weight: topSetWeight, reps: topSetReps }
    const depth = estimateDepth(latest)
    const fatigue = estimateFatigue(sortedRecords)
    const previousTonnage = getPreviousTonnage(sortedRecords)
    const { success: consecutiveSuccess, failure: consecutiveFailure } = getConsecutiveMetrics(
      sortedRecords,
      topSetWeight
    )

    // === 1RM ESTIMATION (Epley) ===
    const estimatedOneRM = estimateOneRM(topSet.weight, topSet.reps)

    // === PROGRESSION LOGIC ===
    let progressionAdjustment = 0
    if (consecutiveSuccess >= 2) {
      progressionAdjustment = 2.5
    } else if (consecutiveFailure >= 2) {
      progressionAdjustment = -2.5
    }

    // === WORKOUT STRUCTURE ===
    let nextSession = {}
    let focus = 'balanced'

    // Neural Tier (90% of 1RM, 1-2 reps, 2-4 sets)
    let neuralWeight = roundToPlate(estimatedOneRM * 0.9 + progressionAdjustment)
    let neuralReps = 2
    let neuralSets = 3
    let neuralPaused = false

    // Strength Tier (80-85% of 1RM, 2-4 reps, 3-4 sets)
    let strengthWeight = roundToPlate(estimatedOneRM * 0.825 + progressionAdjustment)
    let strengthReps = 3
    let strengthSets = 4

    // Volume Tier (70-75% of 1RM, 5-8 reps, 2-4 sets)
    let volumeWeight = roundToPlate(estimatedOneRM * 0.725 + progressionAdjustment)
    let volumeReps = 6
    let volumeSets = 3

    // === FORM CORRECTION RULE ===
    if (depth === 'shallow') {
      neuralWeight = roundToPlate(neuralWeight - 2.5)
      neuralPaused = true
      focus = 'form_correction'
    }

    // === FATIGUE ADJUSTMENT RULE ===
    if (fatigue >= 7) {
      nextSession.neural = null  // Remove neural tier
      volumeSets = Math.max(2, volumeSets - 1)
      focus = 'recovery'
    } else {
      nextSession.neural = {
        title: '① Neural',
        weight: neuralWeight,
        reps: neuralReps,
        sets: neuralSets,
        paused: neuralPaused,
      }
    }

    nextSession.strength = {
      title: '② Strength',
      weight: strengthWeight,
      reps: strengthReps,
      sets: strengthSets,
    }

    nextSession.volume = {
      title: '③ Volume',
      weight: volumeWeight,
      reps: volumeReps,
      sets: volumeSets,
    }

    // === VOLUME SAFETY CONSTRAINT ===
    let projectedTonnage = calculateTonnage(nextSession)
    const maxTonnage = previousTonnage * 1.2

    while (projectedTonnage > maxTonnage && volumeSets > 2) {
      volumeSets -= 1
      nextSession.volume.sets = volumeSets
      projectedTonnage = calculateTonnage(nextSession)
    }

    return {
      estimated_1rm: roundToPlate(estimatedOneRM),
      focus,
      next_session: {
        neural: nextSession.neural,
        strength: nextSession.strength,
        volume: nextSession.volume,
        projected_tonnage: roundToPlate(projectedTonnage),
      },
      _debug: {
        consecutive_success: consecutiveSuccess,
        consecutive_failure: consecutiveFailure,
        fatigue,
        depth,
        previous_tonnage: roundToPlate(previousTonnage),
      },
    }
  }

  // ルールベースの計算（フォールバック用）
  const ruleSuggestions = useMemo(() => {
    const suggestions = {}

    planItems?.forEach((item) => {
      const exerciseName = item.title
      if (!aiSupportTargets?.[exerciseName]) return
      if (aiAddedExercises.has(exerciseName)) return
      const records = workoutRecords[exerciseName] || []
      const recordsForDate = planDate
        ? records.filter((record) => record.date === planDate)
        : records

      if (recordsForDate.length === 0) return

      const workout = generateOptimalWorkout(recordsForDate, exerciseName)
      if (!workout) return

      // プレート最小化と組み合わせる
      const mainWeight = workout.next_session.strength.weight
      const warmupCandidates = [
        mainWeight - 20,
        mainWeight - 10,
        mainWeight - 5,
        workout.next_session.neural?.weight || mainWeight - 20,
      ].filter((w) => w > 20)

      const warmupWeights = findOptimalWeights(mainWeight, warmupCandidates)
      const optimizedNeuralWeight = warmupWeights.length > 0 ? warmupWeights[0] : mainWeight - 20

      const planSets = []
      if (workout.next_session.neural) {
        planSets.push({
          title: '① Neural',
          weight: optimizedNeuralWeight,
          reps: workout.next_session.neural.reps,
          sets: workout.next_session.neural.sets,
          paused: workout.next_session.neural.paused,
        })
      }

      planSets.push({
        title: '② Strength',
        weight: workout.next_session.strength.weight,
        reps: workout.next_session.strength.reps,
        sets: workout.next_session.strength.sets,
      })

      planSets.push({
        title: '③ Volume',
        weight: workout.next_session.volume.weight,
        reps: workout.next_session.volume.reps,
        sets: workout.next_session.volume.sets,
      })

      const focusMsg = {
        balanced: 'バランスの取れたセッション',
        form_correction: 'フォーム改善優先',
        recovery: 'リカバリー優先',
      }[workout.focus] || 'バランスの取れたセッション'

      suggestions[exerciseName] = {
        exerciseName,
        lastWeight: recordsForDate[0]?.weight,
        lastReps: recordsForDate[0]?.reps,
        lastSets: recordsForDate[0]?.sets,
        shortMessage: [focusMsg, `推定1RM: ${workout.estimated_1rm}kg`],
        planSets,
        nextWeight: workout.next_session.strength.weight,
        nextReps: workout.next_session.strength.reps,
        nextSets: workout.next_session.strength.sets,
        reasoning: `連続成功${workout._debug.consecutive_success}回, 連続失敗${workout._debug.consecutive_failure}回, 疲労度${workout._debug.fatigue}/10`,
        timestamp: new Date().toISOString(),
        focus: workout.focus,
        estimated_1rm: workout.estimated_1rm,
        projected_tonnage: workout.next_session.projected_tonnage,
      }
    })

    return suggestions
  }, [workoutRecords, planItems, planDate, aiSupportTargets, aiAddedExercises])

  // AI による提案を取得
  useEffect(() => {
    if (!useAI || !planItems || planItems.length === 0) {
      setAiSuggestions({})
      return
    }

    const fetchAISuggestions = async () => {
      setIsLoadingAI(true)
      const newSuggestions = {}

      for (const item of planItems) {
        const exerciseName = item.title
        if (!aiSupportTargets?.[exerciseName]) continue
        if (aiAddedExercises.has(exerciseName)) continue
        const records = workoutRecords[exerciseName] || []
        const recordsForDate = planDate
          ? records.filter((record) => record.date === planDate)
          : records

        if (recordsForDate.length === 0) continue

        try {
          const response = await fetch('/api/trainer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: recordsForDate.slice(0, 5),
              exerciseName,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              newSuggestions[exerciseName] = {
                ...data.suggestion,
                lastWeight: recordsForDate[0]?.weight,
                lastReps: recordsForDate[0]?.reps,
                lastSets: recordsForDate[0]?.sets,
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
  }, [workoutRecords, planItems, planDate, useAI, aiSupportTargets, aiAddedExercises])

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
