export const weekDaysShort = ['日', '月', '火', '水', '木', '金', '土']

export const getTodayKey = () => new Date().toISOString().slice(0, 10)

export const pad2 = (value) => String(value).padStart(2, '0')

export const formatDateKey = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`

export const formatHistoryDate = (value) => {
  if (!value) return ''
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

export const getHeroDateLabel = () => {
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${
    weekDaysShort[today.getDay()]
  }）`
}

export const formatShortDate = (value) => {
  if (!value) return ''
  const [, month, day] = String(value).split('-')
  if (!month || !day) return value
  return `${month}/${day}`
}
