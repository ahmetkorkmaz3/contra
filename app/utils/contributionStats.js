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

export const WEEKS = 53

// Day 0 of the epoch is a Thursday. The result is 0 for Sunday.
export function weekday(day) {
  return (day + 4) % 7
}

// The days of the calendar, from the Sunday 52 weeks before this week to today.
// max is the highest count in this window.
export function calendarCells(contributions, now) {
  const counts = countsByDay(contributions)
  const today = dayIndex(now)
  const start = today - weekday(today) - (WEEKS - 1) * 7
  const cells = []
  let max = 0
  for (let day = start; day <= today; day++) {
    const count = counts.get(day) || 0
    max = Math.max(max, count)
    cells.push({
      day,
      week: Math.floor((day - start) / 7),
      dow: weekday(day),
      count,
    })
  }
  return { cells, max }
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
