import { useState } from 'react'
import { getTodayKey } from '../utils/date'

const emptyArray = []

const usePlan = (initialPlan = emptyArray) => {
  const [planItems, setPlanItems] = useState(initialPlan)
  const [doneItems, setDoneItems] = useState([])
  const [expandedItems, setExpandedItems] = useState([])
  const [setChecks, setSetChecks] = useState({})
  const [planDate, setPlanDate] = useState(getTodayKey())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMeta, setDraftMeta] = useState('')
  const [draftSets, setDraftSets] = useState([])

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
      { id: `draft-${Date.now()}-${prev.length}`, weight: '', reps: '' },
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

  return {
    planItems,
    setPlanItems,
    doneItems,
    setDoneItems,
    expandedItems,
    setExpandedItems,
    setChecks,
    setSetChecks,
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
  }
}

export default usePlan
