import { useEffect, useMemo, useState } from 'react'
import { formatDateKey, getTodayKey, pad2 } from '../utils/date'

const useRecords = () => {
  const [workoutRecords, setWorkoutRecords] = useState({})
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [recordEditTarget, setRecordEditTarget] = useState(null)
  const [recordExercise, setRecordExercise] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [recordWeight, setRecordWeight] = useState('')
  const [recordReps, setRecordReps] = useState('')
  const [recordSets, setRecordSets] = useState('')
  const [recordMemo, setRecordMemo] = useState('')
  const [recordOutcome, setRecordOutcome] = useState('success')
  const [recordChestTouch, setRecordChestTouch] = useState(true)
  const [recordAllTiersDone, setRecordAllTiersDone] = useState(false)
  const [historyDate, setHistoryDate] = useState(getTodayKey())
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth())
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const monthKey = `${historyYear}-${pad2(historyMonth + 1)}`
    if (!historyDate.startsWith(monthKey)) {
      setHistoryDate(formatDateKey(historyYear, historyMonth, 1))
    }
  }, [historyDate, historyMonth, historyYear])

  const handleRecordOpen = (item, defaultDate) => {
    const today = new Date().toISOString().slice(0, 10)
    const initialDate = defaultDate || today
    setRecordExercise(item.title)
    setRecordDate(initialDate)
    setRecordWeight('')
    setRecordReps('')
    setRecordSets('')
    setRecordMemo('')
    setRecordOutcome('success')
    setRecordChestTouch(true)
    setRecordAllTiersDone(false)
    setRecordEditTarget(null)
    setIsRecordOpen(true)
  }

  const handleRecordEditOpen = (record) => {
    if (!record) return
    setRecordExercise(record.type || '')
    setRecordDate(record.date || getTodayKey())
    setRecordWeight(record.weight ? String(record.weight) : '')
    setRecordReps(Number.isFinite(record.reps) ? String(record.reps) : '')
    setRecordSets(Number.isFinite(record.sets) ? String(record.sets) : '')
    setRecordMemo(record.memo || '')
    setRecordOutcome(record.outcome || 'success')
    setRecordChestTouch(record.chestTouch !== false)
    setRecordAllTiersDone(Boolean(record.allTiersDone))
    setRecordEditTarget({
      id: record.id,
      exerciseName: record.type || '',
    })
    setIsRecordOpen(true)
  }

  const handleRecordClose = () => {
    setIsRecordOpen(false)
    setRecordExercise('')
    setRecordDate('')
    setRecordWeight('')
    setRecordReps('')
    setRecordSets('')
    setRecordMemo('')
    setRecordOutcome('success')
    setRecordChestTouch(true)
    setRecordAllTiersDone(false)
    setRecordEditTarget(null)
  }

  const handleRecordSubmit = (event, onSaved) => {
    event.preventDefault()
    if (!recordExercise || !recordDate || !recordWeight) return
    const memoText = recordMemo.trim()
    const shorthandAllDone = /①\s*②\s*③.*(できた|達成|完了)|1\s*2\s*3.*(できた|達成|完了)/i.test(memoText)
    const parsedAllTiersDone = recordAllTiersDone || shorthandAllDone
    const parsedOutcome = recordOutcome === 'failure' || !recordChestTouch ? 'failure' : 'success'
    const entry = {
      id: recordEditTarget?.id || `rec-${Date.now()}`,
      date: recordDate,
      type: recordExercise,
      weight: recordWeight,
      reps: recordReps ? parseInt(recordReps) : null,
      sets: recordSets ? parseInt(recordSets) : null,
      memo: memoText,
      outcome: parsedOutcome,
      chestTouch: Boolean(recordChestTouch),
      allTiersDone: Boolean(parsedAllTiersDone),
    }
    setWorkoutRecords((prev) => {
      const current = prev[recordExercise] || []
      if (recordEditTarget?.id) {
        return {
          ...prev,
          [recordExercise]: current.map((record) =>
            record.id === recordEditTarget.id ? entry : record
          ),
        }
      }
      return { ...prev, [recordExercise]: [entry, ...current] }
    })
    if (typeof onSaved === 'function') {
      onSaved(recordExercise, entry)
    }
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
          reps: record.reps || null,
          sets: record.sets || null,
          memo: record.memo || '',
          outcome: record.outcome || null,
          chestTouch: record.chestTouch ?? null,
          allTiersDone: record.allTiersDone ?? false,
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

  return {
    workoutRecords,
    setWorkoutRecords,
    isRecordOpen,
    setIsRecordOpen,
    isRecordEditing: Boolean(recordEditTarget),
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
    recordOutcome,
    setRecordOutcome,
    recordChestTouch,
    setRecordChestTouch,
    recordAllTiersDone,
    setRecordAllTiersDone,
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
    handleRecordEditOpen,
    handleRecordClose,
    handleRecordSubmit,
    handleHistoryPrevMonth,
    handleHistoryNextMonth,
  }
}

export default useRecords
