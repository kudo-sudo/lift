import { useMemo, useState } from 'react'

const useBodyWeight = () => {
  const [bodyWeightTarget, setBodyWeightTarget] = useState('')
  const [bodyWeightRecords, setBodyWeightRecords] = useState([])
  const [isWeightRecordOpen, setIsWeightRecordOpen] = useState(false)
  const [weightRecordDate, setWeightRecordDate] = useState('')
  const [weightRecordValue, setWeightRecordValue] = useState('')

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

  return {
    bodyWeightTarget,
    setBodyWeightTarget,
    bodyWeightRecords,
    setBodyWeightRecords,
    isWeightRecordOpen,
    setIsWeightRecordOpen,
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
  }
}

export default useBodyWeight
