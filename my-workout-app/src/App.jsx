import { useEffect, useMemo, useRef, useState } from 'react'
import AddSection from './sections/AddSection'
import GoalsSection from './sections/GoalsSection'
import HeaderHero from './components/HeaderHero'
import HistorySection from './sections/HistorySection'
import HomeSection from './sections/HomeSection'
import AddModal from './components/modals/AddModal'
import ConfirmModal from './components/modals/ConfirmModal'
import NextScheduleModal from './components/modals/NextScheduleModal'
import RecordModal from './components/modals/RecordModal'
import UndoToast from './components/modals/UndoToast'
import WeightRecordModal from './components/modals/WeightRecordModal'
import useBodyWeight from './hooks/useBodyWeight'
import useGoals from './hooks/useGoals'
import useLibrary from './hooks/useLibrary'
import usePlan from './hooks/usePlan'
import useRecords from './hooks/useRecords'
import useSchedule from './hooks/useSchedule'
import useTrainer from './hooks/useTrainer'
import FooterNav from './components/FooterNav'
import {
  formatDateKey,
  formatHistoryDate,
  formatShortDate,
  getHeroDateLabel,
  getTodayKey,
  weekDaysShort,
} from './utils/date'
import './App.css'

const storageKey = 'lift.home.v1'

const initialPlan = []

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [isHydrated, setIsHydrated] = useState(false)
  const [confirmState, setConfirmState] = useState(null)
  const [undoState, setUndoState] = useState(null)
  const [noticeState, setNoticeState] = useState(null)
  const undoTimerRef = useRef(null)
  const noticeTimerRef = useRef(null)

  const {
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
    draftTitle,
    setDraftTitle,
    draftMeta,
    setDraftMeta,
    draftSets,
    setDraftSets,
    handleDuplicateCountChange,
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
    handleDuplicateCountApply,
    handleAddSubmit,
    handleAcceptAISuggestion,
  } = usePlan(initialPlan)

  const {
    exerciseLibrary,
    setExerciseLibrary,
    draftExerciseName,
    setDraftExerciseName,
    draftBodyPart,
    setDraftBodyPart,
    libraryQuery,
    setLibraryQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    expandedBodyParts,
    filteredLibrary,
    bodyPartOptions,
    handleLibrarySubmit,
    handleLibraryToggleFavorite,
    toggleBodyPart,
  } = useLibrary()

  const {
    workoutRecords,
    setWorkoutRecords,
    isRecordOpen,
    recordExercise,
    recordDate,
    setRecordDate,
    recordWeight,
    setRecordWeight,
    recordReps,
    setRecordReps,
    recordSets,
    setRecordSets,
    recordMemo,
    setRecordMemo,
    historyDate,
    setHistoryDate,
    historyMonth,
    historyYear,
    recordsByDate,
    calendarDays,
    selectedHistoryRecords,
    monthlyWorkoutCount,
    weeklyWorkoutCount,
    handleRecordOpen,
    handleRecordClose,
    handleRecordSubmit,
    handleHistoryPrevMonth,
    handleHistoryNextMonth,
  } = useRecords()

  const {
    bodyWeightTarget,
    setBodyWeightTarget,
    bodyWeightRecords,
    setBodyWeightRecords,
    isWeightRecordOpen,
    weightRecordDate,
    setWeightRecordDate,
    weightRecordValue,
    setWeightRecordValue,
    recentWeightRecords,
    weightChartReady,
    yMinWeight,
    yMaxWeight,
    targetWeightNum,
    handleWeightRecordOpen,
    handleWeightRecordClose,
    handleWeightRecordSubmit,
  } = useBodyWeight()

  const {
    isNextScheduleOpen,
    nextScheduleDate,
    setNextScheduleDate,
    handleNextScheduleOpen,
    handleNextScheduleClose,
    handleNextScheduleSubmit,
  } = useSchedule()

  const allPlanItems = useMemo(
    () => Object.values(planItemsByDate).flat(),
    [planItemsByDate]
  )

  const {
    goalsView,
    setGoalsView,
    liftQuery,
    setLiftQuery,
    liftTargetWeights,
    setLiftTargetWeights,
    expandedLiftTargets,
    aiSupportTargets,
    setAiSupportTargets,
    streakGoal,
    setStreakGoal,
    liftTargets,
    filteredLiftTargets,
    handleLiftTargetChange,
    handleLiftTargetToggle,
    handleAiSupportToggle,
    getWeightRecords,
  } = useGoals({ planItems: allPlanItems, exerciseLibrary })

  const { suggestedExercises, isLoadingAI } = useTrainer({
    workoutRecords,
    planItems,
    planDate,
    aiSupportTargets,
  })

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

      if (parsed.planItemsByDate && typeof parsed.planItemsByDate === 'object') {
        setPlanItemsByDate(parsed.planItemsByDate)
      } else if (Array.isArray(parsed.planItems)) {
        const legacyDate =
          typeof parsed.planDate === 'string' ? parsed.planDate : todayKey
        setPlanItemsByDate({ [legacyDate]: parsed.planItems })
      }

      if (parsed.doneItemsByDate && typeof parsed.doneItemsByDate === 'object') {
        setDoneItemsByDate(parsed.doneItemsByDate)
      } else if (Array.isArray(parsed.doneItems)) {
        const legacyDate =
          typeof parsed.planDate === 'string' ? parsed.planDate : todayKey
        setDoneItemsByDate({ [legacyDate]: parsed.doneItems })
      }

      if (Array.isArray(parsed.exerciseLibrary)) {
        setExerciseLibrary(parsed.exerciseLibrary)
      }

      if (parsed.expandedItemsByDate && typeof parsed.expandedItemsByDate === 'object') {
        setExpandedItemsByDate(parsed.expandedItemsByDate)
      } else if (Array.isArray(parsed.expandedItems)) {
        const legacyDate =
          typeof parsed.planDate === 'string' ? parsed.planDate : todayKey
        setExpandedItemsByDate({ [legacyDate]: parsed.expandedItems })
      }

      if (parsed.setChecksByDate && typeof parsed.setChecksByDate === 'object') {
        setSetChecksByDate(parsed.setChecksByDate)
      } else if (parsed.setChecks && typeof parsed.setChecks === 'object') {
        const legacyDate =
          typeof parsed.planDate === 'string' ? parsed.planDate : todayKey
        setSetChecksByDate({ [legacyDate]: parsed.setChecks })
      }

      if (parsed.workoutRecords && typeof parsed.workoutRecords === 'object') {
        setWorkoutRecords(parsed.workoutRecords)
      }
      if (parsed.liftTargetWeights && typeof parsed.liftTargetWeights === 'object') {
        setLiftTargetWeights(parsed.liftTargetWeights)
      }
      if (parsed.aiSupportTargets && typeof parsed.aiSupportTargets === 'object') {
        setAiSupportTargets(parsed.aiSupportTargets)
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

      if (typeof parsed.selectedPlanDate === 'string') {
        setPlanDate(parsed.selectedPlanDate)
      } else if (typeof parsed.planDate === 'string') {
        setPlanDate(parsed.planDate)
      } else {
        setPlanDate(todayKey)
      }
    } catch (error) {
      console.warn('LIFT storage load failed', error)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    const payload = {
      planItemsByDate,
      doneItemsByDate,
      exerciseLibrary,
      expandedItemsByDate,
      setChecksByDate,
      workoutRecords,
      liftTargetWeights,
      aiSupportTargets,
      bodyWeightTarget,
      bodyWeightRecords,
      streakGoal,
      nextScheduleDate,
      selectedPlanDate: planDate,
    }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [
    planItemsByDate,
    doneItemsByDate,
    exerciseLibrary,
    expandedItemsByDate,
    setChecksByDate,
    workoutRecords,
    liftTargetWeights,
    aiSupportTargets,
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

  const showNotice = (message) => {
    setNoticeState({ message })
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current)
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeState(null)
    }, 2500)
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
    handleAddOpen()
  }

  const handleAcceptAISuggestionWithNotice = (suggestion, targetDate) => {
    handleAcceptAISuggestion(suggestion, targetDate)
    const label = formatHistoryDate(targetDate)
    showNotice(`${label}にAIメニューを追加しました`)
  }

  return (
    <div className="app">
      <HeaderHero
        activeTab={activeTab}
        heroDateLabel={getHeroDateLabel()}
        progress={progress}
      />

      {activeTab === 'home' && (
        <main className="content">
          <HomeSection
            planItems={planItems}
            doneItems={doneItems}
            expandedItems={expandedItems}
            setChecks={setChecks}
            planDate={planDate}
            setPlanDate={setPlanDate}
            toggleItem={toggleItem}
            toggleExpand={toggleExpand}
            toggleSet={toggleSet}
            handleRecordOpen={handleRecordOpen}
            handlePlanDelete={handlePlanDelete}
            handleSetDelete={handleSetDelete}
            setActiveTab={setActiveTab}
            setDoneItems={setDoneItems}
            bodyWeightRecords={bodyWeightRecords}
            handleWeightRecordOpen={handleWeightRecordOpen}
            nextScheduleDate={nextScheduleDate}
            formatHistoryDate={formatHistoryDate}
            handleNextScheduleOpen={handleNextScheduleOpen}
            suggestedExercises={suggestedExercises}
            isLoadingAI={isLoadingAI}
            onAcceptAISuggestion={handleAcceptAISuggestionWithNotice}
            getTodayKey={getTodayKey}
          />
        </main>
      )}

      {activeTab === 'add' && (
        <main className="content">
          <AddSection
            libraryQuery={libraryQuery}
            setLibraryQuery={setLibraryQuery}
            handleLibrarySubmit={handleLibrarySubmit}
            draftExerciseName={draftExerciseName}
            setDraftExerciseName={setDraftExerciseName}
            draftBodyPart={draftBodyPart}
            setDraftBodyPart={setDraftBodyPart}
            bodyPartOptions={bodyPartOptions}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            filteredLibrary={filteredLibrary}
            expandedBodyParts={expandedBodyParts}
            toggleBodyPart={toggleBodyPart}
            handleLibraryToggleFavorite={handleLibraryToggleFavorite}
            handleLibraryAddToPlan={handleLibraryAddToPlan}
            handleLibraryDelete={handleLibraryDelete}
            exerciseLibrary={exerciseLibrary}
          />
        </main>
      )}

      {activeTab === 'goals' && (
        <main className="content">
          <GoalsSection
            goalsView={goalsView}
            setGoalsView={setGoalsView}
            liftQuery={liftQuery}
            setLiftQuery={setLiftQuery}
            liftTargets={liftTargets}
            filteredLiftTargets={filteredLiftTargets}
            liftTargetWeights={liftTargetWeights}
            handleLiftTargetChange={handleLiftTargetChange}
            expandedLiftTargets={expandedLiftTargets}
            handleLiftTargetToggle={handleLiftTargetToggle}
            aiSupportTargets={aiSupportTargets}
            handleAiSupportToggle={handleAiSupportToggle}
            getWeightRecords={getWeightRecords}
            workoutRecords={workoutRecords}
            bodyWeightTarget={bodyWeightTarget}
            setBodyWeightTarget={setBodyWeightTarget}
            weightChartReady={weightChartReady}
            recentWeightRecords={recentWeightRecords}
            yMinWeight={yMinWeight}
            yMaxWeight={yMaxWeight}
            targetWeightNum={targetWeightNum}
            bodyWeightRecords={bodyWeightRecords}
            streakGoal={streakGoal}
            setStreakGoal={setStreakGoal}
            weeklyWorkoutCount={weeklyWorkoutCount}
            monthlyWorkoutCount={monthlyWorkoutCount}
            formatShortDate={formatShortDate}
          />
        </main>
      )}

      {activeTab === 'history' && (
        <main className="content">
          <HistorySection
            monthlyWorkoutCount={monthlyWorkoutCount}
            historyYear={historyYear}
            historyMonth={historyMonth}
            handleHistoryPrevMonth={handleHistoryPrevMonth}
            handleHistoryNextMonth={handleHistoryNextMonth}
            weekDaysShort={weekDaysShort}
            calendarDays={calendarDays}
            historyDate={historyDate}
            setHistoryDate={setHistoryDate}
            recordsByDate={recordsByDate}
            selectedHistoryRecords={selectedHistoryRecords}
            formatHistoryDate={formatHistoryDate}
            formatDateKey={formatDateKey}
            getTodayKey={getTodayKey}
          />
        </main>
      )}

      {isAddOpen && activeTab === 'home' && (
        <AddModal
          planDateLabel={formatHistoryDate(planDate)}
          draftTitle={draftTitle}
          setDraftTitle={setDraftTitle}
          draftMeta={draftMeta}
          setDraftMeta={setDraftMeta}
          draftSets={draftSets}
          handleSetChange={handleSetChange}
          handleDuplicateCountChange={handleDuplicateCountChange}
          handleDuplicateCountApply={handleDuplicateCountApply}
          handleRemoveSetRow={handleRemoveSetRow}
          handleAddSetRow={handleAddSetRow}
          handleAddSubmit={handleAddSubmit}
          handleAddClose={handleAddClose}
        />
      )}

      {isRecordOpen && (
        <RecordModal
          recordExercise={recordExercise}
          recordDate={recordDate}
          setRecordDate={setRecordDate}
          recordWeight={recordWeight}
          setRecordWeight={setRecordWeight}
          recordReps={recordReps}
          setRecordReps={setRecordReps}
          recordSets={recordSets}
          setRecordSets={setRecordSets}
          recordMemo={recordMemo}
          setRecordMemo={setRecordMemo}
          handleRecordSubmit={handleRecordSubmit}
          handleRecordClose={handleRecordClose}
        />
      )}

      {isWeightRecordOpen && (
        <WeightRecordModal
          weightRecordDate={weightRecordDate}
          setWeightRecordDate={setWeightRecordDate}
          weightRecordValue={weightRecordValue}
          setWeightRecordValue={setWeightRecordValue}
          handleWeightRecordSubmit={handleWeightRecordSubmit}
          handleWeightRecordClose={handleWeightRecordClose}
        />
      )}

      {isNextScheduleOpen && (
        <NextScheduleModal
          nextScheduleDate={nextScheduleDate}
          setNextScheduleDate={setNextScheduleDate}
          handleNextScheduleSubmit={handleNextScheduleSubmit}
          handleNextScheduleClose={handleNextScheduleClose}
        />
      )}

      {confirmState && (
        <ConfirmModal
          confirmState={confirmState}
          onConfirmDelete={handleConfirmDelete}
          onClose={() => setConfirmState(null)}
        />
      )}

      {noticeState && (
        <div className="notice-toast" role="status" aria-live="polite">
          {noticeState.message}
        </div>
      )}
      {undoState && <UndoToast undoState={undoState} onUndo={handleUndo} />}

      <FooterNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
