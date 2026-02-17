import { useState } from 'react'
import { getTodayKey } from '../utils/date'

const useSchedule = () => {
  const [isNextScheduleOpen, setIsNextScheduleOpen] = useState(false)
  const [nextScheduleDate, setNextScheduleDate] = useState('')

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

  return {
    isNextScheduleOpen,
    setIsNextScheduleOpen,
    nextScheduleDate,
    setNextScheduleDate,
    handleNextScheduleOpen,
    handleNextScheduleClose,
    handleNextScheduleSubmit,
  }
}

export default useSchedule
