import { useMemo, useState, useEffect } from 'react'

const useTrainer = ({
  workoutRecords,
  planItems,
  planDate,
  aiSupportTargets,
  liftTargetWeights,
}) => {
  const [aiSuggestions, setAiSuggestions] = useState({})
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [useAI, setUseAI] = useState(true) // AI を使うかどうかのフラグ

  // ============ Bench Press Workout Generation Engine ============
  // Strict rule-based progression system
  
  const roundToPlate = (weight) => {
    return Math.round(weight / 2.5) * 2.5
  }

  const estimateOneRM = (weight, reps) => {
    if (reps === 1) return weight
    return weight * (1 + reps / 30)
  }

  const sortRecordsNewestFirst = (records) => {
    return [...(records || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const pickHeaviestSet = (planSets) => {
    if (!Array.isArray(planSets) || planSets.length === 0) return null
    return [...planSets].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0]
  }

  const getGoalContext = (exerciseName, estimatedOneRM) => {
    const rawTarget = liftTargetWeights?.[exerciseName]
    const targetWeight = Number.parseFloat(rawTarget)
    if (!Number.isFinite(targetWeight) || targetWeight <= 0) {
      return null
    }

    const progress = Math.max(0, Math.min(100, (estimatedOneRM / targetWeight) * 100))
    const remaining = Math.max(0, targetWeight - estimatedOneRM)

    return {
      targetWeight: roundToPlate(targetWeight),
      currentEstimated1RM: roundToPlate(estimatedOneRM),
      progressPercent: Number(progress.toFixed(1)),
      remainingToGoal: roundToPlate(remaining),
    }
  }

  const getNextTopWeight = ({
    latestWeight,
    consecutiveSuccess,
    consecutiveFailure,
    depth,
    fatigue,
  }) => {
    if (!Number.isFinite(latestWeight) || latestWeight <= 0) return null
    if (fatigue >= 7) return null

    if (depth === 'shallow') {
      return roundToPlate(latestWeight)
    }
    if (consecutiveSuccess >= 2) {
      return roundToPlate(latestWeight + 2.5)
    }
    if (consecutiveFailure >= 2) {
      return roundToPlate(Math.max(20, latestWeight - 2.5))
    }
    return roundToPlate(latestWeight)
  }

  const enforceTopSetRule = ({ suggestion, records }) => {
    if (!suggestion || !Array.isArray(suggestion.planSets) || suggestion.planSets.length === 0) {
      return suggestion
    }

    const sorted = sortRecordsNewestFirst(records)
    const latest = sorted[0]
    if (!latest) return suggestion

    const latestWeight = Number.parseFloat(latest.weight)
    const depth = estimateDepth(latest)
    const fatigue = estimateFatigue(sorted)
    const { success: consecutiveSuccess, failure: consecutiveFailure } = getConsecutiveMetrics(sorted)

    const expectedTop = getNextTopWeight({
      latestWeight,
      consecutiveSuccess,
      consecutiveFailure,
      depth,
      fatigue,
    })

    if (!expectedTop) return suggestion

    const updatedPlanSets = suggestion.planSets.map((setItem, index) => {
      if (index !== 0) return setItem
      const isTopSet =
        `${setItem.title || ''}`.includes('①') || `${setItem.title || ''}`.toLowerCase().includes('neural')
      if (!isTopSet) return setItem
      return {
        ...setItem,
        weight: expectedTop,
      }
    })

    const heaviest = pickHeaviestSet(updatedPlanSets)
    return {
      ...suggestion,
      planSets: updatedPlanSets,
      nextWeight: heaviest?.weight ?? suggestion.nextWeight,
      nextReps: heaviest?.reps ?? suggestion.nextReps,
      nextSets: heaviest?.sets ?? suggestion.nextSets,
    }
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

  const parseRecordOutcome = (record) => {
    if (record?.outcome === 'success' || record?.outcome === 'failure') {
      return record.outcome
    }
    const memo = (record?.memo || '').toLowerCase()
    const reps = Number.parseInt(record?.reps) || 0
    const shorthandAllDone = /①\s*②\s*③.*(できた|達成|完了)|1\s*2\s*3.*(できた|達成|完了)/i.test(memo)
    if (record?.allTiersDone || shorthandAllDone) {
      return 'success'
    }
    const shallow =
      memo.includes('shallow') || memo.includes('浅い') || memo.includes('partial')
    const failed =
      memo.includes('fail') || memo.includes('failed') || memo.includes('失敗') || memo.includes('潰')

    if (failed || shallow || reps <= 0) return 'failure'
    return 'success'
  }

  const getConsecutiveMetrics = (records) => {
    if (!records?.length) return { success: 0, failure: 0 }

    const outcomes = records.map(parseRecordOutcome)
    const first = outcomes[0]
    let count = 0

    for (const outcome of outcomes) {
      if (outcome === first) {
        count += 1
      } else {
        break
      }
    }

    return {
      success: first === 'success' ? count : 0,
      failure: first === 'failure' ? count : 0,
    }
  }

  const getPreviousTonnage = (records) => {
    if (records.length === 0) return 0
    let total = 0
    records.slice(0, 1).forEach((r) => {
      const w = parseFloat(r.weight) || 0
      const reps = parseInt(r.reps) || 5
      const sets = parseInt(r.sets) || 3
      total += w * reps * sets
    })
    return total
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
    if (record?.chestTouch === false) return 'shallow'
    if (record?.chestTouch === true) return 'normal'
    const memo = (record.memo || '').toLowerCase()
    if (memo.includes('shallow') || memo.includes('浅い') || memo.includes('partial')) {
      return 'shallow'
    }
    return 'normal'
  }

  const generateOptimalWorkout = (records) => {
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
      sortedRecords
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

    // Neural Tier (トップ実績基準で維持/増減)
    let neuralWeight = getNextTopWeight({
      latestWeight: topSet.weight,
      consecutiveSuccess,
      consecutiveFailure,
      depth,
      fatigue,
    }) ?? roundToPlate(estimatedOneRM * 0.935 + progressionAdjustment)
    let neuralReps = 1
    let neuralSets = 2
    let neuralPaused = false

    // Strength Tier (85-88% of 1RM, 2-4 reps, 3 sets)
    let strengthWeight = roundToPlate(estimatedOneRM * 0.865 + progressionAdjustment)
    let strengthReps = 3
    let strengthSets = 3

    // Volume Tier (75-80% of 1RM, around 5 reps, 3 sets)
    let volumeWeight = roundToPlate(estimatedOneRM * 0.775 + progressionAdjustment)
    let volumeReps = 5
    let volumeSets = 3

    // === FORM CORRECTION RULE ===
    if (depth === 'shallow') {
      // フォーム崩れ日は据え置き（進歩ロジックの増減を無効化）
      neuralWeight = roundToPlate(estimatedOneRM * 0.935)
      strengthWeight = roundToPlate(estimatedOneRM * 0.865)
      volumeWeight = roundToPlate(estimatedOneRM * 0.775)
      neuralPaused = true
      focus = 'form_correction'
    }

    // === FAILURE ADJUSTMENT RULE ===
    // 1回でも失敗した場合は、次回を少し軽くして立て直す
    if (consecutiveFailure >= 1 && depth !== 'shallow') {
      strengthWeight = roundToPlate(Math.max(20, strengthWeight - 2.5))
      volumeWeight = roundToPlate(Math.max(20, volumeWeight - 2.5))
      strengthSets = 2
      volumeSets = 2
      volumeReps = Math.max(4, volumeReps - 1)
      focus = 'recovery'
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
      const records = sortRecordsNewestFirst(workoutRecords[exerciseName] || [])
      if (records.length === 0) return
      if (planDate && records[0]?.date && planDate < records[0].date) return

      const workout = generateOptimalWorkout(records)
      if (!workout) return
      const goal = getGoalContext(exerciseName, workout.estimated_1rm)

      const planSets = []
      if (workout.next_session.neural) {
        planSets.push({
          title: '① Neural',
          weight: workout.next_session.neural.weight,
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

      const displaySet = pickHeaviestSet(planSets)

      const focusMsg = {
        balanced: 'バランスの取れたセッション',
        form_correction: 'フォーム改善優先',
        recovery: 'リカバリー優先',
      }[workout.focus] || 'バランスの取れたセッション'

      const baseSuggestion = {
        exerciseName,
        lastDate: records[0]?.date,
        lastWeight: records[0]?.weight,
        lastReps: records[0]?.reps,
        lastSets: records[0]?.sets,
        shortMessage: [focusMsg, `推定1RM: ${workout.estimated_1rm}kg`],
        planSets,
        nextWeight: displaySet?.weight ?? workout.next_session.strength.weight,
        nextReps: displaySet?.reps ?? workout.next_session.strength.reps,
        nextSets: displaySet?.sets ?? workout.next_session.strength.sets,
        reasoning: `連続成功${workout._debug.consecutive_success}回, 連続失敗${workout._debug.consecutive_failure}回, 疲労度${workout._debug.fatigue}/10`,
        timestamp: new Date().toISOString(),
        focus: workout.focus,
        estimated_1rm: workout.estimated_1rm,
        projected_tonnage: workout.next_session.projected_tonnage,
        goal,
      }

      suggestions[exerciseName] = enforceTopSetRule({
        suggestion: baseSuggestion,
        records,
      })
    })

    return suggestions
  }, [
    workoutRecords,
    planItems,
    planDate,
    aiSupportTargets,
    liftTargetWeights,
  ])

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
        const records = sortRecordsNewestFirst(workoutRecords[exerciseName] || [])
        if (records.length === 0) continue
        if (planDate && records[0]?.date && planDate < records[0].date) continue
        const latestRecord = records[0]
        const estimatedOneRM = estimateOneRM(
          Number.parseFloat(latestRecord?.weight) || 0,
          Number.parseInt(latestRecord?.reps) || 1
        )
        const goal = getGoalContext(exerciseName, estimatedOneRM)
        const targetWeight = goal?.targetWeight

        try {
          const response = await fetch('/api/trainer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: records.slice(0, 5),
              exerciseName,
              targetWeight,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              const baseSuggestion = {
                ...data.suggestion,
                lastDate: records[0]?.date,
                lastWeight: records[0]?.weight,
                lastReps: records[0]?.reps,
                lastSets: records[0]?.sets,
                goal,
              }
              newSuggestions[exerciseName] = enforceTopSetRule({
                suggestion: baseSuggestion,
                records,
              })
              const displaySet = pickHeaviestSet(newSuggestions[exerciseName].planSets)
              if (displaySet) {
                newSuggestions[exerciseName].nextWeight = displaySet.weight
                newSuggestions[exerciseName].nextReps = displaySet.reps
                newSuggestions[exerciseName].nextSets = displaySet.sets
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
  }, [
    workoutRecords,
    planItems,
    planDate,
    useAI,
    aiSupportTargets,
    liftTargetWeights,
  ])

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
