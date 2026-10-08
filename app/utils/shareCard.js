import { dayIndex, formatDay, formatNumber } from './contributionStats'

// 1200x630 is the image size that X and LinkedIn show without a crop.
export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630
const SCALE = 2
const PAD = 64
const FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
const WEEKS = 53

const GITHUB_ICON =
  'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
const GITLAB_ICON =
  'M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Draws a 24x24 SVG icon path at the given size.
function drawIcon(ctx, d, x, y, size, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 24, size / 24)
  ctx.fillStyle = color
  ctx.fill(new Path2D(d))
  ctx.restore()
}

// Makes the font smaller until the text fits in maxWidth.
function fitFont(ctx, text, weight, size, maxWidth) {
  let current = size
  ctx.font = `${weight} ${current}px ${FONT}`
  while (current > 20 && ctx.measureText(text).width > maxWidth) {
    current -= 2
    ctx.font = `${weight} ${current}px ${FONT}`
  }
}

// Resolves with null if the image does not load. A cross-origin image
// without CORS headers would block toBlob(), so we never draw one.
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawBackground(ctx) {
  ctx.fillStyle = '#030712'
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const glow = ctx.createRadialGradient(240, -60, 0, 240, -60, 720)
  glow.addColorStop(0, 'rgba(99, 102, 241, 0.38)')
  glow.addColorStop(1, 'rgba(99, 102, 241, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const green = ctx.createRadialGradient(1100, 700, 0, 1100, 700, 560)
  green.addColorStop(0, 'rgba(57, 211, 83, 0.14)')
  green.addColorStop(1, 'rgba(57, 211, 83, 0)')
  ctx.fillStyle = green
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
}

function drawProfile(ctx, { avatar, name, githubUsername, gitlabUsername }) {
  const size = 120
  const cx = PAD + size / 2
  const cy = PAD + size / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = '#1f2937'
  ctx.fill()
  ctx.clip()
  if (avatar) {
    ctx.drawImage(avatar, PAD, PAD, size, size)
  } else {
    ctx.fillStyle = '#9ca3af'
    ctx.font = `700 56px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((name || githubUsername).charAt(0).toUpperCase(), cx, cy + 2)
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 + 5, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)'
  ctx.lineWidth = 3
  ctx.stroke()

  const textX = PAD + size + 36
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  fitFont(ctx, name, 700, 52, 620)
  ctx.fillText(name, textX, PAD + 58)

  ctx.font = `500 24px ${FONT}`
  let x = textX
  const y = PAD + 102
  for (const [icon, username] of [
    [GITHUB_ICON, githubUsername],
    [GITLAB_ICON, gitlabUsername],
  ]) {
    drawIcon(ctx, icon, x, y - 21, 24, '#9ca3af')
    ctx.fillStyle = '#d1d5db'
    ctx.fillText(username, x + 34, y)
    x += 34 + ctx.measureText(username).width + 36
  }
}

function drawBadge(ctx, text) {
  ctx.font = `600 18px ${FONT}`
  const w = ctx.measureText(text).width + 40
  const x = CARD_WIDTH - PAD - w
  const y = PAD + 4
  roundRect(ctx, x, y, w, 38, 19)
  ctx.fillStyle = 'rgba(99, 102, 241, 0.14)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#c7d2fe'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + 20, y + 20)
  ctx.textBaseline = 'alphabetic'
}

function drawStats(ctx, stats, top) {
  const gap = 20
  const w = (CARD_WIDTH - PAD * 2 - gap * (stats.length - 1)) / stats.length
  const h = 124
  stats.forEach((stat, i) => {
    const x = PAD + i * (w + gap)
    roundRect(ctx, x, top, w, h, 18)
    ctx.fillStyle = stat.highlight
      ? 'rgba(99, 102, 241, 0.16)'
      : 'rgba(31, 41, 55, 0.55)'
    ctx.fill()
    ctx.strokeStyle = stat.highlight
      ? 'rgba(129, 140, 248, 0.45)'
      : 'rgba(55, 65, 81, 0.8)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#9ca3af'
    ctx.font = `600 15px ${FONT}`
    ctx.fillText(stat.label.toUpperCase(), x + 24, top + 36)
    ctx.fillStyle = '#ffffff'
    fitFont(ctx, stat.value, 700, 46, w - 48)
    ctx.fillText(stat.value, x + 24, top + 88)
    if (stat.hint) {
      ctx.fillStyle = '#6b7280'
      ctx.font = `500 15px ${FONT}`
      ctx.fillText(stat.hint, x + 24, top + 112)
    }
  })
}

function drawHeatmap(ctx, counts, top) {
  const today = dayIndex(Date.now())
  // Day 0 (1970-01-01) is a Thursday. Sunday is the first row, as on GitHub.
  const weekday = (today + 4) % 7
  const start = today - weekday - (WEEKS - 1) * 7
  const pitch = (CARD_WIDTH - PAD * 2) / WEEKS
  const cell = pitch - 4
  const max = Math.max(1, ...counts.values())

  for (let week = 0; week < WEEKS; week++) {
    for (let row = 0; row < 7; row++) {
      const day = start + week * 7 + row
      if (day > today) break
      const count = counts.get(day) || 0
      const level = count ? Math.min(4, Math.ceil((count / max) * 4)) : 0
      roundRect(ctx, PAD + week * pitch, top + row * pitch, cell, cell, 3.5)
      ctx.fillStyle = LEVEL_COLORS[level]
      ctx.fill()
    }
  }
  return top + 7 * pitch
}

function drawFooter(ctx, host, y) {
  ctx.textBaseline = 'middle'
  ctx.font = `700 20px ${FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText('contra', PAD, y)
  const brandWidth = ctx.measureText('contra').width
  ctx.font = `500 18px ${FONT}`
  ctx.fillStyle = '#6b7280'
  ctx.fillText(`·  ${host}`, PAD + brandWidth + 12, y)

  // Legend, right aligned.
  const size = 16
  let x = CARD_WIDTH - PAD
  ctx.textAlign = 'right'
  ctx.fillText('More', x, y)
  x -= ctx.measureText('More').width + 12 + size
  for (let i = LEVEL_COLORS.length - 1; i >= 0; i--) {
    roundRect(ctx, x, y - size / 2, size, size, 3.5)
    ctx.fillStyle = LEVEL_COLORS[i]
    ctx.fill()
    x -= size + 5
  }
  ctx.fillStyle = '#6b7280'
  ctx.fillText('Less', x + size - 7, y)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

export async function renderShareCard({
  avatarUrl,
  name,
  githubUsername,
  gitlabUsername,
  totalContributionCount,
  stats,
  host,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH * SCALE
  canvas.height = CARD_HEIGHT * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const [avatar] = await Promise.all([
    loadImage(avatarUrl),
    document.fonts?.ready,
  ])

  drawBackground(ctx)
  drawProfile(ctx, {
    avatar,
    name: name || githubUsername,
    githubUsername,
    gitlabUsername,
  })
  drawBadge(ctx, 'Last 12 months')
  drawStats(
    ctx,
    [
      {
        label: 'Contributions',
        value: formatNumber(totalContributionCount),
        highlight: true,
      },
      { label: 'Active days', value: formatNumber(stats.activeDays) },
      {
        label: 'Longest streak',
        value: `${stats.longestStreak} days`,
        hint: stats.currentStreak ? `Current: ${stats.currentStreak} days` : '',
      },
      {
        label: 'Best day',
        value: formatNumber(stats.bestDay?.count || 0),
        hint: stats.bestDay ? formatDay(stats.bestDay.day) : '',
      },
    ],
    232,
  )
  const heatmapBottom = drawHeatmap(ctx, stats.counts, 392)
  drawFooter(ctx, host, (heatmapBottom + CARD_HEIGHT) / 2 + 4)

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not make the image')),
      'image/png',
    ),
  )
}
