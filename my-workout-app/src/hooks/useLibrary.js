import { useMemo, useState } from 'react'

const useLibrary = () => {
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [draftExerciseName, setDraftExerciseName] = useState('')
  const [draftBodyPart, setDraftBodyPart] = useState('')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [expandedBodyParts, setExpandedBodyParts] = useState({})

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

  return {
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
    setExpandedBodyParts,
    groupedLibrary,
    filteredLibrary,
    bodyPartOptions,
    handleLibrarySubmit,
    handleLibraryToggleFavorite,
    toggleBodyPart,
  }
}

export default useLibrary
