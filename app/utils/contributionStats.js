export const DAY_MS = 24 * 60 * 60 * 1000

// Day number since the epoch. 'YYYY-MM-DD' strings parse as UTC, so no time zone shift.
export function dayIndex(date) {
  return Math.floor(new Date(date).getTime() / DAY_MS)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatDay(day) {
  return new Date(day * DAY_MS).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Sums the counts for each day. Only days with contributions are in the map.
export function countsByDay(contributions) {
  const counts = new Map()
  for (const item of contributions) {
    if (!item.count) continue
    const day = dayIndex(item.date)
    counts.set(day, (counts.get(day) || 0) + item.count)
  }
  return counts
}

export function getContributionStats(contributions) {
  const counts = countsByDay(contributions)
  const days = [...counts.keys()].sort((a, b) => a - b)

  let longestStreak = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] - days[i - 1] === 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
  }
  // The current streak stays alive if the last active day is today or yesterday.
  const last = days[days.length - 1]
  const currentStreak =
    last !== undefined && dayIndex(Date.now()) - last <= 1 ? run : 0

  let bestDay = null
  for (const [day, count] of counts) {
    if (!bestDay || count > bestDay.count) bestDay = { day, count }
  }

  return {
    counts,
    activeDays: counts.size,
    longestStreak,
    currentStreak,
    bestDay,
  }
}
