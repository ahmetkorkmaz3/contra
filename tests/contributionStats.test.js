import assert from 'node:assert/strict'
import test from 'node:test'
import {
  WEEKS,
  calendarCells,
  dayIndex,
} from '../app/utils/contributionStats.js'

// 2026-10-02 is a Friday. The window starts on Sunday 2025-09-28.
const NOW = Date.UTC(2026, 9, 2, 15)

test('calendarCells gives 53 weeks that end today', () => {
  const { cells } = calendarCells([], NOW)
  assert.equal(cells.length, 52 * 7 + 6)
  assert.equal(cells[0].day, dayIndex('2025-09-28'))
  assert.equal(cells[0].week, 0)
  assert.equal(cells[0].dow, 0)
  const last = cells.at(-1)
  assert.equal(last.day, dayIndex('2026-10-02'))
  assert.equal(last.week, WEEKS - 1)
  assert.equal(last.dow, 5)
})

test('calendarCells sums each day and ignores days outside the window', () => {
  const { cells, max } = calendarCells(
    [
      { date: '2026-10-02', count: 3 },
      { date: '2026-10-02', count: 2 },
      { date: '2026-09-27', count: 1 },
      { date: '2025-01-01', count: 99 },
    ],
    NOW,
  )
  assert.equal(max, 5)
  assert.equal(cells.at(-1).count, 5)
  const sunday = cells.find((cell) => cell.day === dayIndex('2026-09-27'))
  assert.deepEqual(
    { week: sunday.week, dow: sunday.dow, count: sunday.count },
    { week: 52, dow: 0, count: 1 },
  )
})

test('calendarCells gives max 0 when there are no contributions', () => {
  assert.equal(calendarCells([], NOW).max, 0)
})
