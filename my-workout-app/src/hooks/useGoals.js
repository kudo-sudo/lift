import { useMemo, useState } from 'react'

const useGoals = ({ planItems, exerciseLibrary }) => {
  const [goalsView, setGoalsView] = useState('main')
  const [liftQuery, setLiftQuery] = useState('')
  const [liftTargetWeights, setLiftTargetWeights] = useState({})
  const [expandedLiftTargets, setExpandedLiftTargets] = useState({})
  const [streakGoal, setStreakGoal] = useState({
    weeklyTarget: '',
    monthlyTarget: '',
  })

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
    return liftTargets.filter((target) => target.name.toLowerCase().includes(query))
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

  return {
    goalsView,
    setGoalsView,
    liftQuery,
    setLiftQuery,
    liftTargetWeights,
    setLiftTargetWeights,
    expandedLiftTargets,
    setExpandedLiftTargets,
    streakGoal,
    setStreakGoal,
    liftTargets,
    filteredLiftTargets,
    handleLiftTargetChange,
    handleLiftTargetToggle,
    getMaxUpdateRecords,
  }
}

export default useGoals
