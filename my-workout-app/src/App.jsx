import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const storageKey = 'lift.home.v1'
const weekDaysShort = ['日', '月', '火', '水', '木', '金', '土']
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const getTodayKey = () => new Date().toISOString().slice(0, 10)
const pad2 = (value) => String(value).padStart(2, '0')
const formatDateKey = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
const formatHistoryDate = (value) => {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}
const getHeroDateLabel = () => {
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${
    weekDaysShort[today.getDay()]
  }）`
}

const initialPlan = []

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [planItems, setPlanItems] = useState(initialPlan)
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [doneItems, setDoneItems] = useState([])
  const [expandedItems, setExpandedItems] = useState([])
  const [setChecks, setSetChecks] = useState({})
  const [workoutRecords, setWorkoutRecords] = useState({})
  const [planDate, setPlanDate] = useState(getTodayKey())
  const [isHydrated, setIsHydrated] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [confirmState, setConfirmState] = useState(null)
  const [undoState, setUndoState] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMeta, setDraftMeta] = useState('')
  const [draftSets, setDraftSets] = useState([])
  const [draftExerciseName, setDraftExerciseName] = useState('')
  const [draftBodyPart, setDraftBodyPart] = useState('')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [expandedBodyParts, setExpandedBodyParts] = useState({})
  const [goalsView, setGoalsView] = useState('main')
  const [liftQuery, setLiftQuery] = useState('')
  const [liftTargetWeights, setLiftTargetWeights] = useState({})
  const [expandedLiftTargets, setExpandedLiftTargets] = useState({})
  const [bodyWeightTarget, setBodyWeightTarget] = useState('')
  const [bodyWeightRecords, setBodyWeightRecords] = useState([])
  const [isWeightRecordOpen, setIsWeightRecordOpen] = useState(false)
  const [weightRecordDate, setWeightRecordDate] = useState('')
  const [weightRecordValue, setWeightRecordValue] = useState('')
  const [isNextScheduleOpen, setIsNextScheduleOpen] = useState(false)
  const [nextScheduleDate, setNextScheduleDate] = useState('')
  const [streakGoal, setStreakGoal] = useState({
    weeklyTarget: '',
    monthlyTarget: '',
  })
  const [recordExercise, setRecordExercise] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [recordWeight, setRecordWeight] = useState('')
  const [recordMemo, setRecordMemo] = useState('')
  const [historyDate, setHistoryDate] = useState(getTodayKey())
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth())
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear())
  const undoTimerRef = useRef(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) {
      setPlanDate(getTodayKey())
      setIsHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(stored)
      const todayKey = getTodayKey()
      const storedPlanDate =
        typeof parsed.planDate === 'string' ? parsed.planDate : null
      const isSameDay = storedPlanDate === todayKey

      if (Array.isArray(parsed.planItems)) {
        setPlanItems(isSameDay ? parsed.planItems : [])
      }
      if (Array.isArray(parsed.doneItems)) {
        setDoneItems(isSameDay ? parsed.doneItems : [])
      }
      if (Array.isArray(parsed.exerciseLibrary)) {
        setExerciseLibrary(parsed.exerciseLibrary)
      }
      if (Array.isArray(parsed.expandedItems)) {
        setExpandedItems(isSameDay ? parsed.expandedItems : [])
      }
      if (parsed.setChecks && typeof parsed.setChecks === 'object') {
        setSetChecks(isSameDay ? parsed.setChecks : {})
      }
      if (parsed.workoutRecords && typeof parsed.workoutRecords === 'object') {
        setWorkoutRecords(parsed.workoutRecords)
      }
      if (parsed.liftTargetWeights && typeof parsed.liftTargetWeights === 'object') {
        setLiftTargetWeights(parsed.liftTargetWeights)
      }
      if (
        typeof parsed.bodyWeightTarget === 'string' ||
        typeof parsed.bodyWeightTarget === 'number'
      ) {
        setBodyWeightTarget(String(parsed.bodyWeightTarget))
      }
      if (Array.isArray(parsed.bodyWeightRecords)) {
        setBodyWeightRecords(parsed.bodyWeightRecords)
      }
      if (parsed.streakGoal && typeof parsed.streakGoal === 'object') {
        setStreakGoal(parsed.streakGoal)
      }
      if (typeof parsed.nextScheduleDate === 'string') {
        setNextScheduleDate(parsed.nextScheduleDate)
      }
      setPlanDate(isSameDay ? storedPlanDate ?? todayKey : todayKey)
    } catch (error) {
      console.warn('LIFT storage load failed', error)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    const timer = window.setInterval(() => {
      const todayKey = getTodayKey()
      if (planDate !== todayKey) {
        setPlanDate(todayKey)
        setPlanItems([])
        setDoneItems([])
        setExpandedItems([])
        setSetChecks({})
      }
    }, 60000)
    return () => window.clearInterval(timer)
  }, [isHydrated, planDate])

  useEffect(() => {
    const monthKey = `${historyYear}-${pad2(historyMonth + 1)}`
    if (!historyDate.startsWith(monthKey)) {
      setHistoryDate(formatDateKey(historyYear, historyMonth, 1))
    }
  }, [historyDate, historyMonth, historyYear])

  useEffect(() => {
    if (!isHydrated) return
    const payload = {
      planItems,
      doneItems,
      exerciseLibrary,
      expandedItems,
      setChecks,
      workoutRecords,
      liftTargetWeights,
      bodyWeightTarget,
      bodyWeightRecords,
      streakGoal,
      nextScheduleDate,
      planDate,
    }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [
    planItems,
    doneItems,
    exerciseLibrary,
    expandedItems,
    setChecks,
    workoutRecords,
    liftTargetWeights,
    bodyWeightTarget,
    bodyWeightRecords,
    streakGoal,
    nextScheduleDate,
    planDate,
    isHydrated,
  ])

  const progress = useMemo(
    () => ({
      done: doneItems.length,
      total: planItems.length,
    }),
    [doneItems.length, planItems.length]
  )

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

  const handlePlanDelete = (item, index) => {
    setConfirmState({
      type: 'plan',
      item,
      index,
    })
  }

  const handleSetDelete = (planItem, setItem, setIndex, checked) => {
    setConfirmState({
      type: 'set',
      planId: planItem.id,
      planTitle: planItem.title,
      setItem,
      setIndex,
      checked,
    })
  }

  const showUndo = (payload) => {
    setUndoState(payload)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null)
    }, 5000)
  }

  const handleConfirmDelete = () => {
    if (!confirmState) return
    if (confirmState.type === 'plan') {
      const { item, index } = confirmState
      const wasDone = doneItems.includes(item.id)
      const wasExpanded = expandedItems.includes(item.id)
      const planChecks = setChecks[item.id] || null
      removePlanItem(item.id)
      showUndo({
        type: 'plan',
        item,
        index,
        wasDone,
        wasExpanded,
        planChecks,
      })
    }
    if (confirmState.type === 'set') {
      const { planId, planTitle, setItem, setIndex, checked } = confirmState
      removeSet(planId, setItem.id, setIndex)
      showUndo({
        type: 'set',
        planId,
        planTitle,
        setItem,
        setIndex,
        checked,
      })
    }
    if (confirmState.type === 'library') {
      const { entry, index } = confirmState
      const removedPlanItems = planItems
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter((wrapped) => wrapped.item.title === entry.name)
      const removedIds = removedPlanItems.map((wrapped) => wrapped.item.id)
      const removedDone = doneItems.filter((id) => removedIds.includes(id))
      const removedExpanded = expandedItems.filter((id) => removedIds.includes(id))
      const removedSetChecks = removedIds.reduce((acc, id) => {
        if (setChecks[id]) {
          acc[id] = setChecks[id]
        }
        return acc
      }, {})
      const removedRecords = workoutRecords[entry.name] || []
      const removedTargetWeight = liftTargetWeights[entry.name] || ''

      setExerciseLibrary((prev) => prev.filter((item) => item.id !== entry.id))
      if (removedPlanItems.length > 0) {
        setPlanItems((prev) =>
          prev.filter((item) => item.title !== entry.name)
        )
        setDoneItems((prev) => prev.filter((id) => !removedIds.includes(id)))
        setExpandedItems((prev) => prev.filter((id) => !removedIds.includes(id)))
        setSetChecks((prev) => {
          const next = { ...prev }
          removedIds.forEach((id) => {
            delete next[id]
          })
          return next
        })
      }
      setWorkoutRecords((prev) => {
        if (!prev[entry.name]) return prev
        const next = { ...prev }
        delete next[entry.name]
        return next
      })
      setLiftTargetWeights((prev) => {
        if (!prev[entry.name]) return prev
        const next = { ...prev }
        delete next[entry.name]
        return next
      })
      showUndo({
        type: 'library',
        entry,
        index,
        removedPlanItems,
        removedDone,
        removedExpanded,
        removedSetChecks,
        removedRecords,
        removedTargetWeight,
      })
    }
    setConfirmState(null)
  }

  const handleUndo = () => {
    if (!undoState) return
    if (undoState.type === 'plan') {
      const { item, index, wasDone, wasExpanded, planChecks } = undoState
      setPlanItems((prev) => {
        const next = [...prev]
        next.splice(index, 0, item)
        return next
      })
      if (wasDone) {
        setDoneItems((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]))
      }
      if (wasExpanded) {
        setExpandedItems((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id]
        )
      }
      if (planChecks) {
        setSetChecks((prev) => ({ ...prev, [item.id]: planChecks }))
      }
    }
    if (undoState.type === 'set') {
      const { planId, setItem, setIndex, checked } = undoState
      setPlanItems((prev) =>
        prev.map((item) => {
          if (item.id !== planId) return item
          const nextSets = [...(item.sets || [])]
          nextSets.splice(setIndex, 0, setItem)
          return { ...item, sets: nextSets }
        })
      )
      setSetChecks((prev) => {
        const current = prev[planId] || []
        const next = [...current]
        next.splice(setIndex, 0, checked)
        return { ...prev, [planId]: next }
      })
    }
    if (undoState.type === 'library') {
      const {
        entry,
        index,
        removedPlanItems,
        removedDone,
        removedExpanded,
        removedSetChecks,
        removedRecords,
        removedTargetWeight,
      } = undoState
      setExerciseLibrary((prev) => {
        const next = [...prev]
        next.splice(index, 0, entry)
        return next
      })
      if (removedPlanItems && removedPlanItems.length > 0) {
        setPlanItems((prev) => {
          const next = [...prev]
          removedPlanItems
            .slice()
            .sort((a, b) => a.itemIndex - b.itemIndex)
            .forEach((wrapped) => {
              next.splice(wrapped.itemIndex, 0, wrapped.item)
            })
          return next
        })
        setDoneItems((prev) => [...prev, ...removedDone])
        setExpandedItems((prev) => [...prev, ...removedExpanded])
        setSetChecks((prev) => ({ ...prev, ...removedSetChecks }))
      }
      if (removedRecords && removedRecords.length > 0) {
        setWorkoutRecords((prev) => ({ ...prev, [entry.name]: removedRecords }))
      }
      if (removedTargetWeight) {
        setLiftTargetWeights((prev) => ({ ...prev, [entry.name]: removedTargetWeight }))
      }
    }
    setUndoState(null)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }
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
      prev.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
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

  const handleLibrarySubmit = (event) => {
    event.preventDefault()
    const name = draftExerciseName.trim()
    const bodyPart = draftBodyPart.trim()
    if (!name || !bodyPart) return
    const entry = {
      id: `lib-${Date.now()}`,
      name,
      bodyPart,
      favorite: false,
    }
    setExerciseLibrary((prev) => [entry, ...prev])
    setDraftExerciseName('')
    setDraftBodyPart('')
  }

  const handleLibraryDelete = (entry, index) => {
    setConfirmState({
      type: 'library',
      entry,
      index,
    })
  }

  const handleLibraryAddToPlan = (entry) => {
    setDraftTitle(entry.name)
    setDraftMeta(entry.bodyPart ? `Body: ${entry.bodyPart}` : '')
    setDraftSets([])
    setActiveTab('home')
    setIsAddOpen(true)
  }

  const handleLibraryToggleFavorite = (entryId) => {
    setExerciseLibrary((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, favorite: !item.favorite } : item
      )
    )
  }

  const groupedLibrary = useMemo(() => {
    const groups = new Map()
    exerciseLibrary.forEach((item) => {
      if (!groups.has(item.bodyPart)) {
        groups.set(item.bodyPart, [])
      }
      groups.get(item.bodyPart).push(item)
    })
    return Array.from(groups.entries()).map(([bodyPart, items]) => ({
      bodyPart,
      items,
    }))
  }, [exerciseLibrary])

  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase()
    let baseGroups = groupedLibrary

    if (showFavoritesOnly) {
      baseGroups = baseGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.favorite),
        }))
        .filter((group) => group.items.length > 0)
    }

    if (!query) return baseGroups

    return baseGroups
      .map((group) => {
        const matchesBodyPart = group.bodyPart.toLowerCase().includes(query)
        const items = group.items.filter((item) =>
          item.name.toLowerCase().includes(query)
        )
        return matchesBodyPart ? group : { ...group, items }
      })
      .filter((group) => group.items.length > 0)
  }, [groupedLibrary, libraryQuery, showFavoritesOnly])

  const bodyPartOptions = useMemo(() => {
    const parts = new Set()
    exerciseLibrary.forEach((item) => parts.add(item.bodyPart))
    return Array.from(parts)
  }, [exerciseLibrary])

  const toggleBodyPart = (bodyPart) => {
    setExpandedBodyParts((prev) => ({
      ...prev,
      [bodyPart]: !(prev[bodyPart] ?? true),
    }))
  }

  const liftTargets = useMemo(() => {
    const map = new Map()
    planItems.forEach((item) => {
      if (!map.has(item.title)) {
        map.set(item.title, { name: item.title, source: 'plan' })
      }
    })
    exerciseLibrary.forEach((entry) => {
      if (!map.has(entry.name)) {
        map.set(entry.name, { name: entry.name, source: 'library' })
      }
    })
    return Array.from(map.values())
  }, [exerciseLibrary, planItems])

  const filteredLiftTargets = useMemo(() => {
    const query = liftQuery.trim().toLowerCase()
    if (!query) return liftTargets
    return liftTargets.filter((target) =>
      target.name.toLowerCase().includes(query)
    )
  }, [liftQuery, liftTargets])

  const handleLiftTargetChange = (name, value) => {
    setLiftTargetWeights((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLiftTargetToggle = (name) => {
    setExpandedLiftTargets((prev) => ({
      ...prev,
      [name]: !(prev[name] ?? false),
    }))
  }

  const getMaxUpdateRecords = (records, limit) => {
    const updates = []
    let max = -Infinity
    const ordered = [...records].reverse()
    ordered.forEach((record) => {
      const value = Number.parseFloat(record.weight)
      if (Number.isFinite(value) && value > max) {
        max = value
        updates.push(record)
      }
    })
    if (limit) {
      return updates.slice(-limit).reverse()
    }
    return updates
  }

  const formatShortDate = (value) => {
    if (!value) return ''
    const [, month, day] = String(value).split('-')
    if (!month || !day) return value
    return `${month}/${day}`
  }

  const handleRecordOpen = (item) => {
    const today = new Date().toISOString().slice(0, 10)
    setRecordExercise(item.title)
    setRecordDate(today)
    setRecordWeight('')
    setRecordMemo('')
    setIsRecordOpen(true)
  }

  const handleRecordClose = () => {
    setIsRecordOpen(false)
    setRecordExercise('')
    setRecordDate('')
    setRecordWeight('')
    setRecordMemo('')
  }

  const handleRecordSubmit = (event) => {
    event.preventDefault()
    if (!recordExercise || !recordDate || !recordWeight) return
    const entry = {
      id: `rec-${Date.now()}`,
      date: recordDate,
      type: recordExercise,
      weight: recordWeight,
      memo: recordMemo.trim(),
    }
    setWorkoutRecords((prev) => {
      const current = prev[recordExercise] || []
      return { ...prev, [recordExercise]: [entry, ...current] }
    })
    handleRecordClose()
  }

  const recordsByDate = useMemo(() => {
    const map = new Map()
    Object.entries(workoutRecords).forEach(([exercise, records]) => {
      records.forEach((record) => {
        if (!record?.date) return
        const list = map.get(record.date) || []
        list.push({
          id: record.id,
          date: record.date,
          type: record.type || exercise,
          weight: record.weight,
          memo: record.memo || '',
        })
        map.set(record.date, list)
      })
    })
    return map
  }, [workoutRecords])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(historyYear, historyMonth, 1)
    const totalDays = new Date(historyYear, historyMonth + 1, 0).getDate()
    const leadingEmpty = firstDay.getDay()
    const cells = Array.from({ length: leadingEmpty }).map(() => null)
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(day)
    }
    while (cells.length % 7 !== 0) {
      cells.push(null)
    }
    return cells
  }, [historyMonth, historyYear])

  const selectedHistoryRecords = useMemo(() => {
    return recordsByDate.get(historyDate) || []
  }, [recordsByDate, historyDate])

  const monthlyWorkoutCount = useMemo(() => {
    const monthPrefix = `${historyYear}-${pad2(historyMonth + 1)}`
    let count = 0
    recordsByDate.forEach((records, dateKey) => {
      if (dateKey.startsWith(monthPrefix) && records.length > 0) {
        count += 1
      }
    })
    return count
  }, [historyMonth, historyYear, recordsByDate])

  const weeklyWorkoutCount = useMemo(() => {
    const today = new Date()
    // Get Monday of current week (ISO week: Monday = 1, Sunday = 0)
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today.getFullYear(), today.getMonth(), diff)
    
    let count = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const year = d.getFullYear()
      const month = pad2(d.getMonth() + 1)
      const date = pad2(d.getDate())
      const dateKey = `${year}-${month}-${date}`
      
      const records = recordsByDate.get(dateKey)
      if (records && records.length > 0) {
        count += 1
      }
    }
    return count
  }, [recordsByDate])

  const handleHistoryPrevMonth = () => {
    setHistoryMonth((prev) => {
      if (prev === 0) {
        setHistoryYear((year) => year - 1)
        return 11
      }
      return prev - 1
    })
  }

  const handleHistoryNextMonth = () => {
    setHistoryMonth((prev) => {
      if (prev === 11) {
        setHistoryYear((year) => year + 1)
        return 0
      }
      return prev + 1
    })
  }

  const handleWeightRecordOpen = () => {
    const today = new Date().toISOString().slice(0, 10)
    setWeightRecordDate(today)
    setWeightRecordValue('')
    setIsWeightRecordOpen(true)
  }

  const handleWeightRecordClose = () => {
    setIsWeightRecordOpen(false)
    setWeightRecordDate('')
    setWeightRecordValue('')
  }

  const handleWeightRecordSubmit = (event) => {
    event.preventDefault()
    if (!weightRecordDate || !weightRecordValue) return
    const entry = {
      id: `weight-${Date.now()}`,
      date: weightRecordDate,
      value: weightRecordValue,
    }
    setBodyWeightRecords((prev) => [entry, ...prev])
    handleWeightRecordClose()
  }

  const handleNextScheduleOpen = () => {
    setNextScheduleDate((prev) => prev || getTodayKey())
    setIsNextScheduleOpen(true)
  }

  const handleNextScheduleClose = () => {
    setIsNextScheduleOpen(false)
  }

  const handleNextScheduleSubmit = (event) => {
    event.preventDefault()
    if (!nextScheduleDate) return
    setIsNextScheduleOpen(false)
  }

  const recentWeightRecords = useMemo(() => {
    return bodyWeightRecords
      .slice(0, 20)
      .reverse()
      .map((record) => ({
        date: record.date,
        value: Number.parseFloat(record.value),
      }))
      .filter((entry) => Number.isFinite(entry.value))
  }, [bodyWeightRecords])

  const weightChartReady = bodyWeightTarget && recentWeightRecords.length > 0
  const minWeight = weightChartReady
    ? Math.min(...recentWeightRecords.map((entry) => entry.value))
    : 0
  const targetWeightNum = Number.parseFloat(bodyWeightTarget)
  const minBuffer = weightChartReady ? Math.max(1, minWeight * 0.05) : 0
  const maxBuffer = weightChartReady ? Math.max(1, targetWeightNum * 0.05) : 0
  const yMinWeight = weightChartReady ? Math.max(0, minWeight - minBuffer) : 0
  const yMaxWeight = weightChartReady ? targetWeightNum + maxBuffer : 0

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <div className="brand-mark">LIFT</div>
        </div>
        {activeTab === 'home' && (
          <div className="hero-card">
            <div className="hero-date">{getHeroDateLabel()}</div>
            <div className="hero-progress">
              <span>{progress.done}</span>
              <span className="hero-progress-divider">/</span>
              <span>{progress.total}</span>
              <span className="hero-progress-label">done</span>
            </div>
          </div>
        )}
      </header>

      {activeTab === 'home' && (
        <main className="content">
          <section className="section">
            <div className="section-header">
              <h2>Today Plan</h2>
              <div className="section-actions">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setActiveTab('add')}
                  aria-label="Go to Add"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setDoneItems([])}
                >
                  Reset
                </button>
              </div>
            </div>
            {planItems.length === 0 && (
              <div className="empty-state">
                <div className="empty-title">今日のメニューがありません</div>
                <button
                  className="solid-button"
                  type="button"
                  onClick={() => setActiveTab('add')}
                >
                  Addタブから追加
                </button>
              </div>
            )}
            <ul className="checklist">
              {planItems.map((item, index) => {
                const isDone = doneItems.includes(item.id)
                const isExpanded = expandedItems.includes(item.id)
                const setStatus = setChecks[item.id] || []
                return (
                  <li
                    className={`checklist-item ${isDone ? 'done' : ''}`}
                    key={item.id}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="checklist-row">
                      <label className="checklist-label">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="checkmark" aria-hidden="true" />
                        <span className="checklist-text">
                          <span className="checklist-title">{item.title}</span>
                          <span className="checklist-meta">{item.meta}</span>
                        </span>
                      </label>
                      <div className="checklist-actions">
                        {item.sets && (
                          <button
                            className={`pill-button ${
                              isExpanded ? 'active' : ''
                            }`}
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            aria-expanded={isExpanded}
                          >
                            Sets
                            <svg viewBox="0 0 24 24">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </button>
                        )}
                        <button
                          className="record-button"
                          type="button"
                          onClick={() => handleRecordOpen(item)}
                          aria-label="Record workout"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M4 19V8" />
                            <path d="M10 19V5" />
                            <path d="M16 19v-7" />
                            <path d="M22 19V9" />
                          </svg>
                        </button>
                        <button
                          className="plan-delete"
                          type="button"
                          onClick={() => handlePlanDelete(item, index)}
                          aria-label="Remove workout"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M4 7h16" />
                            <path d="M9 7V5h6v2" />
                            <path d="M9 11v6M15 11v6" />
                            <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {item.sets && isExpanded && (
                      <ul className="setlist">
                        {item.sets.map((setItem, setIndex) => (
                          <li className="set-item" key={setItem.id}>
                            <div className="set-row">
                              <label className="set-label">
                                <input
                                  type="checkbox"
                                  checked={Boolean(setStatus[setIndex])}
                                  onChange={() => toggleSet(item.id, setIndex)}
                                />
                                <span className="set-checkmark" aria-hidden="true" />
                                <span className="set-text">
                                  <span className="set-title">{setItem.title}</span>
                                  <span className="set-meta">{setItem.meta}</span>
                                </span>
                              </label>
                              <button
                                className="set-delete"
                                type="button"
                                onClick={() =>
                                  handleSetDelete(
                                    item,
                                    setItem,
                                    setIndex,
                                    Boolean(setStatus[setIndex])
                                  )
                                }
                                aria-label="Remove set"
                              >
                                <svg viewBox="0 0 24 24">
                                  <path d="M4 7h16" />
                                  <path d="M9 7V5h6v2" />
                                  <path d="M9 11v6M15 11v6" />
                                  <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="section stats">
            <button
              className="stat-card"
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                setWeightRecordDate(today)
                setWeightRecordValue('')
                setIsWeightRecordOpen(true)
              }}
            >
              <div className="stat-label">体重を記録</div>
              <div className="stat-value">
                {bodyWeightRecords.length > 0
                  ? `${bodyWeightRecords[0].value} kg`
                  : '--'}
              </div>
            </button>
            <button
              className="stat-card"
              type="button"
              onClick={handleNextScheduleOpen}
            >
              <div className="stat-label">次回日程</div>
              <div className="stat-value">
                {nextScheduleDate ? formatHistoryDate(nextScheduleDate) : '--'}
              </div>
            </button>
          </section>
        </main>
      )}

      {activeTab === 'add' && (
        <main className="content">
          <section className="section library">
            <div className="section-header">
              <h2>Exercise Library</h2>
              <div className="section-meta">部位ごとに整理</div>
            </div>
            <div className="library-search">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <input
                className="search-input"
                value={libraryQuery}
                onChange={(event) => setLibraryQuery(event.target.value)}
                placeholder="種目名や部位で検索"
              />
            </div>
            <form className="library-form" onSubmit={handleLibrarySubmit}>
              <div className="library-form-hint">
                種目と体の部分を設定してAddボタンで追加する
              </div>
              <label className="field">
                <span className="field-label">Workout</span>
                <input
                  className="field-input"
                  value={draftExerciseName}
                  onChange={(event) => setDraftExerciseName(event.target.value)}
                  placeholder="例: Incline Bench Press"
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Body Part</span>
                <input
                  className="field-input"
                  value={draftBodyPart}
                  onChange={(event) => setDraftBodyPart(event.target.value)}
                  placeholder="例: Chest / Back / Legs"
                  list="body-part-options"
                  required
                />
                <datalist id="body-part-options">
                  {bodyPartOptions.map((part) => (
                    <option key={part} value={part} />
                  ))}
                </datalist>
              </label>
              <div className="library-actions">
                <button className="solid-button" type="submit">
                  Add
                </button>
              </div>
            </form>

            <div className="library-hint">
              プラスボタンを押してToday Planに追加
            </div>
            <div className="library-filters">
              <button
                className={`ghost-button ${showFavoritesOnly ? 'is-active' : ''}`}
                type="button"
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
              >
                お気に入りのみ
              </button>
            </div>

            <div className="library-groups">
              {exerciseLibrary.length === 0 && (
                <div className="empty-state">まだ登録されていません</div>
              )}
              {exerciseLibrary.length > 0 && filteredLibrary.length === 0 && (
                <div className="empty-state">該当する種目がありません</div>
              )}
              {filteredLibrary.map((group) => {
                const isExpanded = expandedBodyParts[group.bodyPart] ?? true
                return (
                  <div
                    className={`library-group ${isExpanded ? 'open' : 'collapsed'}`}
                    key={group.bodyPart}
                  >
                    <button
                      className="library-group-header"
                      type="button"
                      onClick={() => toggleBodyPart(group.bodyPart)}
                      aria-expanded={isExpanded}
                    >
                      <span className="library-group-title">{group.bodyPart}</span>
                      <span className="library-group-toggle" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    <ul className="library-list" aria-hidden={!isExpanded}>
                      {group.items.map((entry) => (
                        <li
                          className={`library-item ${entry.favorite ? 'is-favorite' : ''}`}
                          key={entry.id}
                        >
                          <span>{entry.name}</span>
                          <div className="library-item-actions">
                            <button
                              className={`library-favorite ${
                                entry.favorite ? 'is-active' : ''
                              }`}
                              type="button"
                              onClick={() => handleLibraryToggleFavorite(entry.id)}
                              aria-pressed={entry.favorite}
                              aria-label="お気に入り"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            </button>
                            <button
                              className="library-add"
                              type="button"
                              onClick={() => handleLibraryAddToPlan(entry)}
                              aria-label="Add to Today Plan"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                            <button
                              className="library-delete"
                              type="button"
                              onClick={() =>
                                handleLibraryDelete(
                                  entry,
                                  exerciseLibrary.findIndex(
                                    (item) => item.id === entry.id
                                  )
                                )
                              }
                              aria-label="Remove exercise"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M4 7h16" />
                                <path d="M9 7V5h6v2" />
                                <path d="M9 11v6M15 11v6" />
                                <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      )}

      {activeTab === 'goals' && (
        <main className="content">
          <section className="section goals">
            <div className="section-header">
              <h2>Goals</h2>
              <div className="section-meta">シンプルに管理</div>
            </div>

            {goalsView === 'main' && (
              <div className="goals-grid">
                <button
                  className="goal-card is-button"
                  type="button"
                  onClick={() => setGoalsView('lift')}
                >
                  <div className="goal-title">Lift Targets</div>
                  <div className="goal-sub">各種目の目標重量</div>
                </button>
                <button
                  className="goal-card is-button"
                  type="button"
                  onClick={() => setGoalsView('weight')}
                >
                  <div className="goal-title">Body Weight</div>
                  <div className="goal-sub">体重目標</div>
                </button>
                <button
                  className="goal-card is-button"
                  type="button"
                  onClick={() => setGoalsView('streak')}
                >
                  <div className="goal-title">Streak</div>
                  <div className="goal-sub">継続目標</div>
                </button>
              </div>
            )}

            {goalsView === 'lift' && (
              <div className="goal-detail">
                <div className="goal-detail-header">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setGoalsView('main')}
                  >
                    Back
                  </button>
                  <div className="goal-detail-title">Lift Targets</div>
                </div>
                <div className="goal-detail-body">
                  <div className="library-search">
                    <span className="search-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3.5-3.5" />
                      </svg>
                    </span>
                    <input
                      className="search-input"
                      value={liftQuery}
                      onChange={(event) => setLiftQuery(event.target.value)}
                      placeholder="種目名で検索"
                    />
                  </div>
                  {liftTargets.length === 0 && (
                    <div className="empty-state">まだ登録されていません</div>
                  )}
                  {liftTargets.length > 0 && filteredLiftTargets.length === 0 && (
                    <div className="empty-state">該当する種目がありません</div>
                  )}
                  {filteredLiftTargets.length > 0 && (
                    <ul className="target-list">
                      {filteredLiftTargets.map((target, targetIndex) => {
                        const records = workoutRecords[target.name] || []
                        const maxUpdateRecords = getMaxUpdateRecords(records, 5)
                        const maxUpdateSeries = getMaxUpdateRecords(records)
                          .map((record) => ({
                            date: record.date,
                            weight: Number.parseFloat(record.weight),
                          }))
                          .filter((entry) => Number.isFinite(entry.weight))
                        const latestRecord = records[0]
                        const targetWeight = Number.parseFloat(
                          liftTargetWeights[target.name]
                        )
                        const latestValue = Number.parseFloat(latestRecord?.weight)
                        const remaining = Number.isFinite(targetWeight)
                          ? Math.max(
                              targetWeight - (Number.isFinite(latestValue) ? latestValue : 0),
                              0
                            )
                          : null
                        const showTargetChart =
                          Number.isFinite(targetWeight) && maxUpdateSeries.length > 0
                        const chartId = `lift-target-${targetIndex}`
                        const minSeriesWeight = showTargetChart
                          ? Math.min(...maxUpdateSeries.map((entry) => entry.weight))
                          : 0
                        const minBuffer = showTargetChart
                          ? Math.max(2, minSeriesWeight * 0.05)
                          : 0
                        const maxBuffer = showTargetChart
                          ? Math.max(2, targetWeight * 0.05)
                          : 0
                        const yMin = showTargetChart
                          ? Math.max(0, minSeriesWeight - minBuffer)
                          : 0
                        const yMax = showTargetChart ? targetWeight + maxBuffer : 0

                        return (
                          <li
                            className={`target-item ${
                              expandedLiftTargets[target.name] ? 'open' : ''
                            }`}
                            key={target.name}
                          >
                            <button
                              className="target-row"
                              type="button"
                              onClick={() => handleLiftTargetToggle(target.name)}
                            >
                              <span className="target-name">{target.name}</span>
                              <span className="target-row-toggle" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </span>
                            </button>
                            {expandedLiftTargets[target.name] && (
                              <div className="target-panel">
                                <div className="target-panel-header">
                                  <span className="target-panel-name">{target.name}</span>
                                  <span className="target-panel-weight">
                                    目標 {liftTargetWeights[target.name] || '--'} kg
                                  </span>
                                </div>
                                <div className="target-panel-message">
                                  {remaining === null
                                    ? '目標重量を入力してください'
                                    : `達成まであと ${remaining} kg`}
                                </div>
                                <label className="target-edit">
                                  <span className="target-edit-label">目標重量</span>
                                  <input
                                    className="target-input"
                                    value={liftTargetWeights[target.name] || ''}
                                    onChange={(event) =>
                                      handleLiftTargetChange(
                                        target.name,
                                        event.target.value
                                      )
                                    }
                                    placeholder="Target (kg)"
                                  />
                                </label>
                                {showTargetChart && (
                                  <div className="target-chart">
                                    <div className="target-chart-title">
                                      Max Update
                                    </div>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <AreaChart data={maxUpdateSeries} margin={{
                                        top: 10,
                                        right: 16,
                                        left: 0,
                                        bottom: 0,
                                      }}>
                                        <defs>
                                          <linearGradient
                                            id={chartId}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                          >
                                            <stop
                                              offset="0%"
                                              stopColor="#2d9cff"
                                              stopOpacity={0.4}
                                            />
                                            <stop
                                              offset="100%"
                                              stopColor="#2d9cff"
                                              stopOpacity={0.05}
                                            />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                          stroke="rgba(255, 255, 255, 0.08)"
                                          vertical={false}
                                        />
                                        <XAxis
                                          dataKey="date"
                                          tickFormatter={formatShortDate}
                                          stroke="rgba(255, 255, 255, 0.4)"
                                          tick={{ fill: '#9aa3af', fontSize: 11 }}
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <YAxis
                                          domain={[yMin, yMax]}
                                          stroke="rgba(255, 255, 255, 0.4)"
                                          tick={{ fill: '#9aa3af', fontSize: 11 }}
                                          axisLine={false}
                                          tickLine={false}
                                          width={50}
                                        />
                                        <Tooltip
                                          labelFormatter={formatShortDate}
                                          formatter={(value) => [`${value} kg`, 'MAX']}
                                          contentStyle={{
                                            background: 'rgba(12, 14, 18, 0.95)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '12px',
                                          }}
                                          labelStyle={{ color: '#9aa3af' }}
                                        />
                                        <ReferenceLine
                                          y={targetWeight}
                                          stroke="#ff6b6b"
                                          strokeDasharray="6 6"
                                          label={{
                                            value: '目標ライン',
                                            fill: '#ff6b6b',
                                            fontSize: 11,
                                            position: 'right',
                                          }}
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="weight"
                                          stroke="#2d9cff"
                                          strokeWidth={2}
                                          fill={`url(#${chartId})`}
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                                {maxUpdateRecords.length > 0 && (
                                  <div className="target-records">
                                    {maxUpdateRecords.map((record) => (
                                      <div className="target-record" key={record.id}>
                                        <span className="target-record-date">
                                          {record.date}
                                        </span>
                                        <span className="target-record-weight">
                                          {record.weight} kg
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {goalsView === 'weight' && (
              <div className="goal-detail">
                <div className="goal-detail-header">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setGoalsView('main')}
                  >
                    Back
                  </button>
                  <div className="goal-detail-title">Body Weight</div>
                </div>
                <div className="goal-detail-body">
                  <div className="weight-goal-summary">
                    目標体重 {bodyWeightTarget || '--'} kg
                  </div>
                  <label className="target-edit">
                    <span className="target-edit-label">目標体重</span>
                    <input
                      className="target-input"
                      type="number"
                      inputMode="decimal"
                      value={bodyWeightTarget}
                      onChange={(event) => setBodyWeightTarget(event.target.value)}
                      placeholder="例: 68"
                      min="0"
                      step="0.1"
                    />
                  </label>
                  {weightChartReady && (
                    <div className="weight-chart">
                      <div className="weight-chart-title">
                        推移（直近20個）
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={recentWeightRecords} margin={{
                          top: 10,
                          right: 16,
                          left: 0,
                          bottom: 0,
                        }}>
                          <defs>
                            <linearGradient
                              id="weight-chart"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#2d9cff"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="100%"
                                stopColor="#2d9cff"
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="rgba(255, 255, 255, 0.08)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatShortDate}
                            stroke="rgba(255, 255, 255, 0.4)"
                            tick={{ fill: '#9aa3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[yMinWeight, yMaxWeight]}
                            stroke="rgba(255, 255, 255, 0.4)"
                            tick={{ fill: '#9aa3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                          />
                          <Tooltip
                            labelFormatter={formatShortDate}
                            formatter={(value) => [`${value} kg`, '体重']}
                            contentStyle={{
                              background: 'rgba(12, 14, 18, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#9aa3af' }}
                          />
                          <ReferenceLine
                            y={targetWeightNum}
                            stroke="#ff6b6b"
                            strokeDasharray="6 6"
                            label={{
                              value: '目標',
                              fill: '#ff6b6b',
                              fontSize: 11,
                              position: 'right',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2d9cff"
                            strokeWidth={2}
                            fill="url(#weight-chart)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {bodyWeightRecords.length > 0 && (
                    <div className="weight-records">
                      <div className="weight-records-title">全記録（{bodyWeightRecords.length}個）</div>
                      <div className="weight-record-list">
                        {bodyWeightRecords.slice(0, 5).map((record) => (
                          <div className="weight-record-item" key={record.id}>
                            <span className="weight-record-date">
                              {record.date}
                            </span>
                            <span className="weight-record-value">
                              {record.value} kg
                            </span>
                          </div>
                        ))}
                      </div>
                      {bodyWeightRecords.length > 5 && (
                        <div className="weight-more-hint">
                          他{bodyWeightRecords.length - 5}件の記録
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {goalsView === 'streak' && (
              <div className="goal-detail">
                <div className="goal-detail-header">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setGoalsView('main')}
                  >
                    Back
                  </button>
                  <div className="goal-detail-title">Streak</div>
                </div>
                <div className="goal-detail-body">
                  <div className="streak-summary">
                    <div className="streak-summary-item">
                      <div className="streak-label">今週</div>
                      <div className="streak-value">
                        {weeklyWorkoutCount} / {streakGoal.weeklyTarget || '--'}
                      </div>
                    </div>
                    <div className="streak-summary-item">
                      <div className="streak-label">今月</div>
                      <div className="streak-value">
                        {monthlyWorkoutCount} / {streakGoal.monthlyTarget || '--'}
                      </div>
                    </div>
                  </div>
                  <label className="target-edit">
                    <span className="target-edit-label">週何回</span>
                    <input
                      className="target-input"
                      type="number"
                      inputMode="numeric"
                      value={streakGoal.weeklyTarget}
                      onChange={(event) =>
                        setStreakGoal((prev) => ({
                          ...prev,
                          weeklyTarget: event.target.value,
                        }))
                      }
                      placeholder="例: 3"
                      min="0"
                    />
                  </label>
                  <label className="target-edit">
                    <span className="target-edit-label">月何回</span>
                    <input
                      className="target-input"
                      type="number"
                      inputMode="numeric"
                      value={streakGoal.monthlyTarget}
                      onChange={(event) =>
                        setStreakGoal((prev) => ({
                          ...prev,
                          monthlyTarget: event.target.value,
                        }))
                      }
                      placeholder="例: 12"
                      min="0"
                    />
                  </label>
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'history' && (
        <main className="content">
          <section className="section history">
            <div className="section-header">
              <h2>History</h2>
              <div className="section-meta">今月の記録</div>
            </div>
            <div className="history-card">
              <div className="history-summary">
                <div className="history-summary-label">今月</div>
                <div className="history-summary-value">
                  {monthlyWorkoutCount} 回
                </div>
              </div>
              <div className="history-calendar-header">
                <button
                  className="icon-button ghost"
                  type="button"
                  onClick={handleHistoryPrevMonth}
                  aria-label="Previous month"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <div className="history-month">
                  {historyYear}年{historyMonth + 1}月
                </div>
                <button
                  className="icon-button ghost"
                  type="button"
                  onClick={handleHistoryNextMonth}
                  aria-label="Next month"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="history-weekdays">
                {weekDaysShort.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="history-grid">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div className="history-cell is-empty" key={`empty-${index}`} />
                    )
                  }
                  const dateKey = formatDateKey(historyYear, historyMonth, day)
                  const hasWorkouts = recordsByDate.has(dateKey)
                  const isSelected = historyDate === dateKey
                  const isToday = dateKey === getTodayKey()

                  return (
                    <button
                      className={`history-day${
                        hasWorkouts ? ' has-workout' : ''
                      }${isSelected ? ' is-selected' : ''}${
                        isToday ? ' is-today' : ''
                      }`}
                      type="button"
                      key={dateKey}
                      onClick={() => setHistoryDate(dateKey)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${dateKey}`}
                    >
                      <span className="history-day-number">{day}</span>
                      {hasWorkouts && (
                        <span className="history-dot" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="history-records">
              <div className="history-records-header">
                {formatHistoryDate(historyDate)}
              </div>
              {selectedHistoryRecords.length === 0 && (
                <div className="empty-state">この日の記録はありません</div>
              )}
              {selectedHistoryRecords.length > 0 && (
                <div className="history-record-list">
                  {selectedHistoryRecords.map((record) => (
                    <div className="history-record-item" key={record.id}>
                      <div className="history-record-title">{record.type}</div>
                      <div className="history-record-meta">
                        {record.weight} kg
                        {record.memo ? ` · ${record.memo}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="history-notice">
              <div className="history-notice-title">データの取り扱い</div>
              <p>
                このアプリの記録は端末内（ローカルストレージ）に保存されます。
                サーバーには送信されません。ブラウザのデータを削除すると記録も消えます。
              </p>
            </div>
          </section>
        </main>
      )}

      {isAddOpen && activeTab === 'home' && (
        <div className="add-modal" role="dialog" aria-modal="true">
          <div className="add-backdrop" onClick={handleAddClose} />
          <form className="add-card" onSubmit={handleAddSubmit}>
            <div className="add-header">
              <div>
                <div className="add-title">Today Plan</div>
                <div className="add-subtitle">新しいメニューを追加</div>
              </div>
              <button
                className="icon-button ghost"
                type="button"
                onClick={handleAddClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <label className="field">
              <span className="field-label">Workout</span>
              <input
                className="field-input"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="例: インクライン Bench Press"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Notes</span>
              <input
                className="field-input"
                value={draftMeta}
                onChange={(event) => setDraftMeta(event.target.value)}
                placeholder="例: 4 x 8 · 60kg"
              />
            </label>
            <div className="field">
              <span className="field-label">Drop set</span>
              <div className="set-builder">
                {draftSets.map((row, index) => (
                  <div className="set-builder-row" key={row.id}>
                    <div className="set-builder-title">Set {index + 1}</div>
                    <input
                      className="field-input compact"
                      value={row.weight}
                      onChange={(event) =>
                        handleSetChange(row.id, 'weight', event.target.value)
                      }
                      placeholder="Weight (例: 70kg)"
                    />
                    <input
                      className="field-input compact"
                      value={row.reps}
                      onChange={(event) =>
                        handleSetChange(row.id, 'reps', event.target.value)
                      }
                      placeholder="Reps (例: 6)"
                    />
                    <button
                      className="row-delete"
                      type="button"
                      onClick={() => handleRemoveSetRow(row.id)}
                      aria-label="Remove set row"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M4 7h16" />
                        <path d="M9 7V5h6v2" />
                        <path d="M9 11v6M15 11v6" />
                        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button className="add-set" type="button" onClick={handleAddSetRow}>
                + Add Set
              </button>
            </div>
            <div className="add-actions">
              <button className="ghost-button" type="button" onClick={handleAddClose}>
                Cancel
              </button>
              <button className="solid-button" type="submit">
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {isRecordOpen && (
        <div className="record-modal" role="dialog" aria-modal="true">
          <div className="record-backdrop" onClick={handleRecordClose} />
          <form className="record-card" onSubmit={handleRecordSubmit}>
            <div className="record-header">
              <div>
                <div className="record-title">Record</div>
                <div className="record-subtitle">{recordExercise}</div>
              </div>
              <button
                className="icon-button ghost"
                type="button"
                onClick={handleRecordClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <label className="field">
              <span className="field-label">Date</span>
              <input
                className="field-input"
                type="date"
                value={recordDate}
                onChange={(event) => setRecordDate(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Weight (kg)</span>
              <input
                className="field-input"
                type="number"
                inputMode="decimal"
                value={recordWeight}
                onChange={(event) => setRecordWeight(event.target.value)}
                placeholder="例: 80"
                min="0"
                step="0.5"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">メモ</span>
              <input
                className="field-input"
                value={recordMemo}
                onChange={(event) => setRecordMemo(event.target.value)}
                placeholder="例: フォーム良かった"
              />
            </label>
            <div className="record-actions">
              <button className="ghost-button" type="button" onClick={handleRecordClose}>
                Cancel
              </button>
              <button className="solid-button" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {isWeightRecordOpen && (
        <div className="record-modal" role="dialog" aria-modal="true">
          <div className="record-backdrop" onClick={handleWeightRecordClose} />
          <form className="record-card" onSubmit={handleWeightRecordSubmit}>
            <div className="record-header">
              <div>
                <div className="record-title">体重を記録</div>
              </div>
              <button
                className="icon-button ghost"
                type="button"
                onClick={handleWeightRecordClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <label className="field">
              <span className="field-label">日付</span>
              <input
                className="field-input"
                type="date"
                value={weightRecordDate}
                onChange={(event) => setWeightRecordDate(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">体重 (kg)</span>
              <input
                className="field-input"
                type="number"
                inputMode="decimal"
                value={weightRecordValue}
                onChange={(event) => setWeightRecordValue(event.target.value)}
                placeholder="例: 70.5"
                min="0"
                step="0.1"
                required
              />
            </label>
            <div className="record-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={handleWeightRecordClose}
              >
                Cancel
              </button>
              <button className="solid-button" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {isNextScheduleOpen && (
        <div className="record-modal" role="dialog" aria-modal="true">
          <div className="record-backdrop" onClick={handleNextScheduleClose} />
          <form className="record-card" onSubmit={handleNextScheduleSubmit}>
            <div className="record-header">
              <div>
                <div className="record-title">次回日程を設定</div>
              </div>
              <button
                className="icon-button ghost"
                type="button"
                onClick={handleNextScheduleClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <label className="field">
              <span className="field-label">日付</span>
              <input
                className="field-input"
                type="date"
                value={nextScheduleDate}
                onChange={(event) => setNextScheduleDate(event.target.value)}
                required
              />
            </label>
            <div className="record-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={handleNextScheduleClose}
              >
                Cancel
              </button>
              <button className="solid-button" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmState && (
        <div className="confirm-modal" role="dialog" aria-modal="true">
          <div className="confirm-backdrop" onClick={() => setConfirmState(null)} />
          <div className="confirm-card">
            <div className="confirm-title">Delete?</div>
            <div className="confirm-text">
              {confirmState.type === 'plan'
                ? `${confirmState.item.title} を削除しますか？`
                : confirmState.type === 'set'
                  ? `${confirmState.planTitle} / ${confirmState.setItem.title} を削除しますか？`
                  : `${confirmState.entry.name} を削除しますか？\nHome と Goals からも削除されます。`}
            </div>
            <div className="confirm-actions">
              <button className="ghost-button" type="button" onClick={() => setConfirmState(null)}>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {undoState && (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>
            {undoState.type === 'plan'
              ? `${undoState.item.title} を削除しました`
              : undoState.type === 'set'
                ? `${undoState.planTitle} / ${undoState.setItem.title} を削除しました`
                : `${undoState.entry.name} を削除しました`}
          </span>
          <button className="undo-button" type="button" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}

      <footer className="footer-nav" aria-label="Primary">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
            </svg>
          </span>
          Home
        </button>
        <button
          className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('add')}
        >
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Add
        </button>
        <button
          className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('goals')}
        >
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
          </span>
          Goals
        </button>
        <button
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('history')}
        >
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </span>
          History
        </button>
      </footer>
    </div>
  )
}

export default App
