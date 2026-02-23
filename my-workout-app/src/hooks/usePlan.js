import { useState } from 'react'
import { getTodayKey } from '../utils/date'

const emptyArray = []

const usePlan = (initialPlan = emptyArray) => {
  const todayKey = getTodayKey()
  const [planItemsByDate, setPlanItemsByDate] = useState(() =>
    initialPlan.length > 0 ? { [todayKey]: initialPlan } : {}
  )
  const [doneItemsByDate, setDoneItemsByDate] = useState({})
  const [expandedItemsByDate, setExpandedItemsByDate] = useState({})
  const [setChecksByDate, setSetChecksByDate] = useState({})
  const [planDate, setPlanDate] = useState(getTodayKey())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMeta, setDraftMeta] = useState('')
  const [draftSets, setDraftSets] = useState([])

  const planItems = planItemsByDate[planDate] || []
  const doneItems = doneItemsByDate[planDate] || []
  const expandedItems = expandedItemsByDate[planDate] || []
  const setChecks = setChecksByDate[planDate] || {}

  const updateDateArrayState = (setter, dateKey, updater, fallback) => {
    setter((prev) => {
      const current = prev[dateKey] ?? fallback
      const nextValue = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [dateKey]: nextValue }
    })
  }

  const updateDateObjectState = (setter, dateKey, updater) => {
    setter((prev) => {
      const current = prev[dateKey] ?? {}
      const nextValue = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [dateKey]: nextValue }
    })
  }

  const setPlanItems = (updater) => {
    updateDateArrayState(setPlanItemsByDate, planDate, updater, [])
  }

  const setDoneItems = (updater) => {
    updateDateArrayState(setDoneItemsByDate, planDate, updater, [])
  }

  const setExpandedItems = (updater) => {
    updateDateArrayState(setExpandedItemsByDate, planDate, updater, [])
  }

  const setSetChecks = (updater) => {
    updateDateObjectState(setSetChecksByDate, planDate, updater)
  }

  const toggleItem = (id) => {
    setDoneItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleExpand = (id) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSet = (planId, index) => {
    setSetChecks((prev) => {
      const current = prev[planId] || []
      const next = [...current]
      next[index] = !next[index]
      return { ...prev, [planId]: next }
    })
  }

  const removePlanItem = (planId) => {
    setPlanItems((prev) => prev.filter((item) => item.id !== planId))
    setDoneItems((prev) => prev.filter((itemId) => itemId !== planId))
    setExpandedItems((prev) => prev.filter((itemId) => itemId !== planId))
    setSetChecks((prev) => {
      const next = { ...prev }
      delete next[planId]
      return next
    })
  }

  const removeSet = (planId, setId, index) => {
    setPlanItems((prev) =>
      prev.map((item) => {
        if (item.id !== planId) return item
        const nextSets = (item.sets || []).filter((setItem) => setItem.id !== setId)
        return { ...item, sets: nextSets }
      })
    )
    setSetChecks((prev) => {
      const current = prev[planId] || []
      const next = [...current]
      next.splice(index, 1)
      return { ...prev, [planId]: next }
    })
  }

  const handleAddOpen = () => {
    setIsAddOpen(true)
  }

  const handleAddClose = () => {
    setIsAddOpen(false)
    setDraftTitle('')
    setDraftMeta('')
    setDraftSets([])
  }

  const handleAddSetRow = () => {
    setDraftSets((prev) => [
      ...prev,
      { id: `draft-${Date.now()}-${prev.length}`, weight: '', reps: '', copyCount: '' },
    ])
  }

  const handleRemoveSetRow = (rowId) => {
    setDraftSets((prev) => prev.filter((row) => row.id !== rowId))
  }

  const handleSetChange = (rowId, field, value) => {
    setDraftSets((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const handleDuplicateCountChange = (rowId, value) => {
    setDraftSets((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, copyCount: value } : row))
    )
  }

  const handleDuplicateCountApply = (rowId) => {
    setDraftSets((prev) => {
      const index = prev.findIndex((row) => row.id === rowId)
      if (index === -1) return prev

      const target = prev[index]
      const count = parseInt(target.copyCount)
      if (isNaN(count) || count < 1) return prev

      const copies = Array.from({ length: count }, (_, copyIndex) => ({
        id: `draft-${Date.now()}-${index}-${copyIndex}`,
        weight: target.weight,
        reps: target.reps,
        copyCount: '',
      }))

      return [...prev.slice(0, index), ...copies, ...prev.slice(index + 1)]
    })
  }

  const handleAddSubmit = (event) => {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) return
    const meta = draftMeta.trim()
    const preparedSets = draftSets
      .map((row, index) => ({
        id: `set-${Date.now()}-${index}`,
        title: `Set ${index + 1}`,
        meta: `${row.weight || 'weight?'} · ${row.reps || 'reps?'}`,
      }))
      .filter((row) => row.meta.trim() !== 'weight? · reps?')
    const id = `custom-${Date.now()}`
    setPlanItems((prev) => [
      ...prev,
      {
        id,
        title,
        meta: meta || 'メモなし',
        ...(preparedSets.length ? { sets: preparedSets } : {}),
      },
    ])
    if (preparedSets.length) {
      setSetChecks((prev) => ({
        ...prev,
        [id]: preparedSets.map(() => false),
      }))
    }
    handleAddClose()
  }

  const handleAcceptAISuggestion = (suggestion, targetDate = planDate) => {
    if (!suggestion) return

    const dateKey = targetDate || planDate

    const { exerciseName, nextWeight, nextReps, nextSets, planSets } = suggestion

    const preparedPlanSets = Array.isArray(planSets) ? planSets : []
    const sets = []
    let setIndex = 0

    if (preparedPlanSets.length > 0) {
      preparedPlanSets.forEach((planSet) => {
        const weight = planSet.weight ?? nextWeight
        const reps = planSet.reps ?? nextReps
        const count = planSet.sets ?? 1
        for (let i = 0; i < count; i++) {
          sets.push({
            id: `set-${Date.now()}-${setIndex}`,
            title: `Set ${setIndex + 1}`,
            meta: `${weight}kg · ${reps}reps`,
          })
          setIndex += 1
        }
      })
    } else {
      for (let i = 0; i < nextSets; i++) {
        sets.push({
          id: `set-${Date.now()}-${i}`,
          title: `Set ${i + 1}`,
          meta: `${nextWeight}kg · ${nextReps}reps`,
        })
      }
    }

    const id = `ai-${Date.now()}`
    const meta = preparedPlanSets.length > 0
      ? preparedPlanSets
          .map((planSet) => {
            const weight = planSet.weight ?? nextWeight
            const reps = planSet.reps ?? nextReps
            const count = planSet.sets
            return `${weight}kg×${reps}${count ? `×${count}` : ''}`
          })
          .join(' / ')
      : `${nextWeight}kg · ${nextReps}reps × ${nextSets}sets`

    updateDateArrayState(setPlanItemsByDate, dateKey, (prev) => [
      ...prev,
      {
        id,
        title: exerciseName,
        meta,
        sets,
        source: 'ai',
      },
    ], [])

    if (sets.length) {
      updateDateObjectState(setSetChecksByDate, dateKey, (prev) => ({
        ...prev,
        [id]: sets.map(() => false),
      }))
    }
  }

  return {
    planItems,
    setPlanItems,
    planItemsByDate,
    setPlanItemsByDate,
    doneItems,
    setDoneItems,
    doneItemsByDate,
    setDoneItemsByDate,
    expandedItems,
    setExpandedItems,
    expandedItemsByDate,
    setExpandedItemsByDate,
    setChecks,
    setSetChecks,
    setChecksByDate,
    setSetChecksByDate,
    planDate,
    setPlanDate,
    isAddOpen,
    setIsAddOpen,
    draftTitle,
    setDraftTitle,
    draftMeta,
    setDraftMeta,
    draftSets,
    setDraftSets,
    handleDuplicateCountChange,
    handleDuplicateCountApply,
    toggleItem,
    toggleExpand,
    toggleSet,
    removePlanItem,
    removeSet,
    handleAddOpen,
    handleAddClose,
    handleAddSetRow,
    handleRemoveSetRow,
    handleSetChange,
    handleAddSubmit,
    handleAcceptAISuggestion,
  }
}

export default usePlan
