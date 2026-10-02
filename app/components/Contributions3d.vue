<template>
  <!-- 3D view of the same calendar. Each day is a bar, and the bar height shows the count. -->
  <div>
    <svg
      class="contra-heatmap-3d block aspect-[2/1] w-full touch-none select-none outline-none"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      :viewBox="viewBox"
      role="img"
      tabindex="0"
      :aria-label="`${totalContributionCount} contributions in the last 12 months, 3D view. Drag or use the arrow keys to turn it.`"
      @pointerdown="startDrag"
      @pointermove="drag"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @dblclick="resetView"
      @keydown="rotateWithKeys"
    >
      <!-- Keyed by position, so a new draw order changes attributes and does not move nodes. -->
      <g
        v-for="(bar, i) in bars"
        :key="i"
        class="bar"
        :style="{ animationDelay: `${bar.week * 12}ms` }"
      >
        <title>{{ bar.label }}</title>
        <polygon
          v-for="(face, j) in bar.faces"
          :key="j"
          :points="face.points"
          :fill="face.color"
        />
      </g>
    </svg>
    <div
      class="mt-2 flex items-center justify-between gap-3 text-xs text-[#8b949e]"
    >
      <div class="flex items-center gap-2">
        <span>Drag to rotate</span>
        <button
          v-if="rotated"
          type="button"
          class="rounded px-1.5 py-0.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          @click="resetView"
        >
          Reset
        </button>
      </div>
      <div class="flex items-center gap-1">
        <span class="mr-1">Less</span>
        <span
          v-for="color in legendColors"
          :key="color"
          class="h-2.5 w-2.5 rounded-[2px]"
          :style="{ backgroundColor: color }"
        />
        <span class="ml-1">More</span>
      </div>
    </div>
  </div>
</template>

<script>
import {
  WEEKS,
  calendarCells,
  formatDay,
  formatNumber,
} from '~/utils/contributionStats'

// All sizes are in tile units. One tile is one day.
const MAX_HEIGHT = 7
const EMPTY_HEIGHT = 0.08
const GAP = 0.12
const PADDING = 0.6

// Camera angles in degrees. Yaw turns around the vertical axis. Pitch is the angle above the ground.
const DEFAULT_YAW = 30
const DEFAULT_PITCH = 38
const MIN_PITCH = 10
const MAX_PITCH = 85
const DRAG_SPEED = 0.4
const KEY_STEP = 10

// Same colors as the 2D view. Index 0 is a day without contributions.
const COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']

function shade(hex, factor) {
  const value = parseInt(hex.slice(1), 16)
  const channel = (shift) =>
    Math.min(255, Math.round(((value >> shift) & 255) * factor))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Orthographic camera. u is the week, v is the weekday, and h is the height.
// It gives the screen point and the depth. A larger depth is nearer to the viewer.
function makeCamera(yaw, pitch) {
  const a = (yaw * Math.PI) / 180
  const p = (pitch * Math.PI) / 180
  const cosA = Math.cos(a)
  const sinA = Math.sin(a)
  const sinP = Math.sin(p)
  const cosP = Math.cos(p)
  return {
    cosA,
    sinA,
    project(u, v, h = 0) {
      const x = u - WEEKS / 2
      const z = v - 3.5
      const depth = x * sinA + z * cosA
      return [x * cosA - z * sinA, depth * sinP - h * cosP]
    },
    depth(u, v) {
      return (u - WEEKS / 2) * sinA + (v - 3.5) * cosA
    },
  }
}

function points(corners) {
  return corners.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ')
}

export default {
  name: 'Contributions3d',
  props: {
    data: {
      type: Array,
      required: true,
    },
    totalContributionCount: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      yaw: DEFAULT_YAW,
      pitch: DEFAULT_PITCH,
      dragging: false,
    }
  },
  computed: {
    legendColors() {
      return COLORS
    },
    rotated() {
      return this.yaw !== DEFAULT_YAW || this.pitch !== DEFAULT_PITCH
    },
    camera() {
      return makeCamera(this.yaw, this.pitch)
    },
    // The bars in world space. They do not change when the camera turns.
    cells() {
      const { cells, max } = calendarCells(this.data, Date.now())
      return {
        cells: cells.map(({ day, week, dow, count }) => {
          const level = count ? Math.max(1, Math.ceil((count / max) * 4)) : 0
          const unit = count === 1 ? 'contribution' : 'contributions'
          return {
            week,
            dow,
            height: count
              ? Math.max(0.3, (count / max) * MAX_HEIGHT)
              : EMPTY_HEIGHT,
            color: COLORS[level],
            label: `${formatNumber(count)} ${unit} on ${formatDay(day)}`,
          }
        }),
        maxHeight: max ? MAX_HEIGHT : EMPTY_HEIGHT,
      }
    },
    // The camera fits the whole calendar box, so no part goes out of the view.
    viewBox() {
      const { project } = this.camera
      const h = this.cells.maxHeight
      const corners = []
      for (const u of [0, WEEKS]) {
        for (const v of [0, 7]) {
          corners.push(project(u, v), project(u, v, h))
        }
      }
      const xs = corners.map((c) => c[0])
      const ys = corners.map((c) => c[1])
      const minX = Math.min(...xs) - PADDING
      const minY = Math.min(...ys) - PADDING
      const width = Math.max(...xs) + PADDING - minX
      const height = Math.max(...ys) + PADDING - minY
      return `${minX} ${minY} ${width} ${height}`
    },
    bars() {
      const { project, depth, cosA, sinA } = this.camera
      // A side is visible when it faces the camera. Light comes from the left of the screen.
      const sideX = sinA >= 0 ? 1 : 0
      const sideZ = cosA >= 0 ? 1 : 0
      const lightX = 0.62 - 0.14 * (sideX ? cosA : -cosA)
      const lightZ = 0.62 + 0.14 * (sideZ ? sinA : -sinA)

      return this.cells.cells
        .map((cell) => {
          const u0 = cell.week + GAP
          const u1 = cell.week + 1 - GAP
          const v0 = cell.dow + GAP
          const v1 = cell.dow + 1 - GAP
          const h = cell.height
          const u = sideX ? u1 : u0
          const v = sideZ ? v1 : v0
          return {
            week: cell.week,
            label: cell.label,
            depth: depth(cell.week + 0.5, cell.dow + 0.5),
            faces: [
              {
                color: shade(cell.color, lightX),
                points: points([
                  project(u, v0, h),
                  project(u, v1, h),
                  project(u, v1),
                  project(u, v0),
                ]),
              },
              {
                color: shade(cell.color, lightZ),
                points: points([
                  project(u0, v, h),
                  project(u1, v, h),
                  project(u1, v),
                  project(u0, v),
                ]),
              },
              {
                color: cell.color,
                points: points([
                  project(u0, v0, h),
                  project(u1, v0, h),
                  project(u1, v1, h),
                  project(u0, v1, h),
                ]),
              },
            ],
          }
        })
        .sort((a, b) => a.depth - b.depth)
    },
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame)
  },
  methods: {
    startDrag(event) {
      if (event.button !== 0) return
      this.dragging = true
      this.last = { x: event.clientX, y: event.clientY }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    drag(event) {
      if (!this.dragging) return
      const dx = event.clientX - this.last.x
      const dy = event.clientY - this.last.y
      this.last = { x: event.clientX, y: event.clientY }
      this.pending = {
        yaw: (this.pending?.yaw ?? this.yaw) - dx * DRAG_SPEED,
        pitch: clamp(
          (this.pending?.pitch ?? this.pitch) + dy * DRAG_SPEED,
          MIN_PITCH,
          MAX_PITCH,
        ),
      }
      // Draw at most once for each frame.
      if (this.frame) return
      this.frame = requestAnimationFrame(() => {
        this.frame = null
        this.setView(this.pending.yaw, this.pending.pitch)
        this.pending = null
      })
    },
    stopDrag() {
      this.dragging = false
    },
    setView(yaw, pitch) {
      this.yaw = ((yaw % 360) + 360) % 360
      this.pitch = clamp(pitch, MIN_PITCH, MAX_PITCH)
    },
    resetView() {
      this.setView(DEFAULT_YAW, DEFAULT_PITCH)
    },
    rotateWithKeys(event) {
      const moves = {
        ArrowLeft: [KEY_STEP, 0],
        ArrowRight: [-KEY_STEP, 0],
        ArrowUp: [0, -KEY_STEP],
        ArrowDown: [0, KEY_STEP],
      }
      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      this.setView(this.yaw + move[0], this.pitch + move[1])
    },
  },
}
</script>

<style scoped>
.bar {
  transform-box: fill-box;
  transform-origin: bottom;
  animation: grow 500ms ease-out both;
}
.bar:hover polygon {
  filter: brightness(1.35);
}
.contra-heatmap-3d:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 4px;
  border-radius: 0.5rem;
}
@keyframes grow {
  from {
    transform: scaleY(0.05);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
  }
}
</style>
