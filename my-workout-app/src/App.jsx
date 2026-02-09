import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const storageKey = 'lift.home.v1'

const initialPlan = [
  {
    id: 'bench',
    title: 'Bench Press',
    meta: 'Drop set · 4 stages',
    sets: [
      { id: 'bench-1', title: 'Set 1', meta: '70kg · 6 reps' },
      { id: 'bench-2', title: 'Set 2', meta: '62.5kg · 6 reps' },
      { id: 'bench-3', title: 'Set 3', meta: '55kg · 8 reps' },
      { id: 'bench-4', title: 'Set 4', meta: '50kg · 10 reps' },
    ],
  },
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [planItems, setPlanItems] = useState(initialPlan)
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [doneItems, setDoneItems] = useState(['warmup'])
  const [expandedItems, setExpandedItems] = useState(['bench'])
  const [setChecks, setSetChecks] = useState({
    bench: [false, false, false, false],
  })
  const [workoutRecords, setWorkoutRecords] = useState({})
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
  const [expandedBodyParts, setExpandedBodyParts] = useState({})
  const [goalsView, setGoalsView] = useState('main')
  const [liftQuery, setLiftQuery] = useState('')
  const [liftTargetWeights, setLiftTargetWeights] = useState({})
  const [expandedLiftTargets, setExpandedLiftTargets] = useState({})
  const [recordExercise, setRecordExercise] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [recordWeight, setRecordWeight] = useState('')
  const undoTimerRef = useRef(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) {
      setIsHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed.planItems)) {
        setPlanItems(parsed.planItems)
      }
      if (Array.isArray(parsed.doneItems)) {
        setDoneItems(parsed.doneItems)
      }
      if (Array.isArray(parsed.exerciseLibrary)) {
        setExerciseLibrary(parsed.exerciseLibrary)
      }
      if (Array.isArray(parsed.expandedItems)) {
        setExpandedItems(parsed.expandedItems)
      }
      if (parsed.setChecks && typeof parsed.setChecks === 'object') {
        setSetChecks(parsed.setChecks)
      }
      if (parsed.workoutRecords && typeof parsed.workoutRecords === 'object') {
        setWorkoutRecords(parsed.workoutRecords)
      }
      if (parsed.liftTargetWeights && typeof parsed.liftTargetWeights === 'object') {
        setLiftTargetWeights(parsed.liftTargetWeights)
      }
    } catch (error) {
      console.warn('LIFT storage load failed', error)
    }
    setIsHydrated(true)
  }, [])

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
      setExerciseLibrary((prev) => prev.filter((item) => item.id !== entry.id))
      showUndo({
        type: 'library',
        entry,
        index,
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
      const { entry, index } = undoState
      setExerciseLibrary((prev) => {
        const next = [...prev]
        next.splice(index, 0, entry)
        return next
      })
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
    if (!query) return groupedLibrary
    return groupedLibrary
      .map((group) => {
        const matchesBodyPart = group.bodyPart.toLowerCase().includes(query)
        const items = group.items.filter((item) =>
          item.name.toLowerCase().includes(query)
        )
        return matchesBodyPart ? group : { ...group, items }
      })
      .filter((group) => group.items.length > 0)
  }, [groupedLibrary, libraryQuery])

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

  const handleRecordOpen = (item) => {
    const today = new Date().toISOString().slice(0, 10)
    setRecordExercise(item.title)
    setRecordDate(today)
    setRecordWeight('')
    setIsRecordOpen(true)
  }

  const handleRecordClose = () => {
    setIsRecordOpen(false)
    setRecordExercise('')
    setRecordDate('')
    setRecordWeight('')
  }

  const handleRecordSubmit = (event) => {
    event.preventDefault()
    if (!recordExercise || !recordDate || !recordWeight) return
    const entry = {
      id: `rec-${Date.now()}`,
      date: recordDate,
      weight: recordWeight,
    }
    setWorkoutRecords((prev) => {
      const current = prev[recordExercise] || []
      return { ...prev, [recordExercise]: [entry, ...current] }
    })
    handleRecordClose()
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <div className="brand-mark">LIFT</div>
        </div>
        <div className="hero-card">
          <div className="hero-date">Mon · Feb 9</div>
          <div className="hero-progress">
            <span>{progress.done}</span>
            <span className="hero-progress-divider">/</span>
            <span>{progress.total}</span>
            <span className="hero-progress-label">done</span>
          </div>
        </div>
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
                  onClick={handleAddOpen}
                  aria-label="Today plan add"
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
            <div>
              <div className="stat-label">連続記録</div>
              <div className="stat-value">12 days</div>
            </div>
            <div>
              <div className="stat-label">次の休養</div>
              <div className="stat-value">Tomorrow</div>
            </div>
            <div>
              <div className="stat-label">Focus</div>
              <div className="stat-value">Push power</div>
            </div>
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
                placeholder="Search workouts or body part"
              />
            </div>
            <form className="library-form" onSubmit={handleLibrarySubmit}>
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
                        <li className="library-item" key={entry.id}>
                          <span>{entry.name}</span>
                          <div className="library-item-actions">
                            <span className="library-tag">Saved</span>
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
                <div className="goal-card">
                  <div className="goal-title">Body Weight</div>
                  <div className="goal-sub">体重目標</div>
                </div>
                <div className="goal-card">
                  <div className="goal-title">Streak</div>
                  <div className="goal-sub">継続目標</div>
                </div>
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
                      placeholder="Search targets"
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
                      {filteredLiftTargets.map((target) => (
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
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
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
                  : `${confirmState.entry.name} を削除しますか？`}
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
        <button className="nav-item" type="button">
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
