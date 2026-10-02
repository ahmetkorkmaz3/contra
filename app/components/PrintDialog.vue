<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      @click.self="$emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-dialog-title"
        class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 id="print-dialog-title" class="text-lg font-semibold text-white">
            Print your graph
          </h2>
          <button
            ref="closeButton"
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
            @click="$emit('close')"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>

        <div
          class="relative aspect-[2/1] touch-none overflow-hidden rounded-xl border border-gray-800 bg-gray-950"
        >
          <!-- three.js puts its canvas here. Vue does not manage the children of this element. -->
          <div ref="canvasHost" class="absolute inset-0"></div>
          <div
            v-if="loadError"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-red-300"
          >
            {{ loadError }}
            <button
              type="button"
              class="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-200 hover:border-gray-500 hover:text-white"
              @click="load"
            >
              Retry
            </button>
          </div>
          <div
            v-else-if="previewError"
            class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-400"
          >
            {{ previewError }}
          </div>
          <div
            v-else-if="!ready"
            class="absolute inset-0 animate-pulse bg-gray-800/60"
          ></div>
        </div>
        <p v-if="!previewError" class="mt-2 text-xs text-[#8b949e]">
          Drag to turn. Scroll or pinch to zoom.
        </p>

        <label
          for="print-text"
          class="mt-5 block text-sm font-medium text-gray-300"
        >
          Text on the front
        </label>
        <input
          id="print-text"
          v-model="text"
          type="text"
          :maxlength="maxLength"
          autocomplete="off"
          spellcheck="false"
          placeholder="Your nickname"
          class="mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <div class="mt-1 flex justify-between gap-3 text-xs">
          <span class="text-amber-300">
            {{ unsupported ? 'Some characters are not supported' : '' }}
          </span>
          <span class="tabular-nums text-gray-500">
            {{ length }}/{{ maxLength }}
          </span>
        </div>

        <button
          type="button"
          class="print-button mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-500"
          :disabled="!ready"
          @click="download"
        >
          Download STL
        </button>
        <p class="mt-3 text-center text-xs text-gray-500">
          About 180 x 43 x 28 mm. It prints flat, without supports.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script>
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  DEPTH,
  MAX_TEXT_LENGTH,
  PLATE_TOP,
  WIDTH,
  buildPrintModel,
  exportStl,
  parseFont,
  stlFileName,
  supportedText,
} from '~/utils/printModel'

const FONT_URL = '/fonts/Inter-Bold.ttf'
const REBUILD_DELAY = 250
// The color of the highest level in the 2D and 3D views.
const MODEL_COLOR = '#39d353'
const BACKGROUND = '#030712'

export default {
  name: 'PrintDialog',
  emits: ['close'],
  props: {
    // The cells and max from calendarCells().
    cells: {
      type: Array,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    defaultText: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      text: [...this.defaultText].slice(0, MAX_TEXT_LENGTH).join(''),
      maxLength: MAX_TEXT_LENGTH,
      ready: false,
      unsupported: false,
      loadError: '',
      previewError: '',
    }
  },
  computed: {
    length() {
      return [...this.text].length
    },
  },
  watch: {
    text() {
      clearTimeout(this.rebuildTimer)
      this.rebuildTimer = setTimeout(this.rebuild, REBUILD_DELAY)
    },
  },
  mounted() {
    this.$refs.closeButton.focus()
    document.addEventListener('keydown', this.onKeydown)
    document.body.style.overflow = 'hidden'
    this.startPreview()
    this.load()
  },
  beforeUnmount() {
    // A font response that comes after this point must not touch the scene.
    this.closed = true
    document.removeEventListener('keydown', this.onKeydown)
    document.body.style.overflow = ''
    clearTimeout(this.rebuildTimer)
    this.resizeObserver?.disconnect()
    this.renderer?.setAnimationLoop(null)
    this.controls?.dispose()
    this.geometry?.dispose()
    this.material?.dispose()
    this.renderer?.dispose()
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close')
    },
    async load() {
      this.loadError = ''
      try {
        const buffer = await $fetch(FONT_URL, { responseType: 'arrayBuffer' })
        if (this.closed) return
        this.font = parseFont(buffer)
        this.rebuild()
        this.ready = true
      } catch (err) {
        if (this.closed) return
        this.loadError = 'Could not load the font. Check your connection.'
        console.error(err)
      }
    },
    // The preview is optional. Without WebGL, the download still works.
    startPreview() {
      try {
        this.renderer = new WebGLRenderer({ antialias: true })
      } catch (err) {
        this.previewError =
          'Your browser cannot show the 3D preview. You can still download the STL file.'
        console.error(err)
        return
      }
      const host = this.$refs.canvasHost
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      host.appendChild(this.renderer.domElement)

      this.scene = new Scene()
      this.scene.background = new Color(BACKGROUND)
      this.scene.add(new AmbientLight('#ffffff', 0.6))
      const light = new DirectionalLight('#ffffff', 2.2)
      light.position.set(-60, -120, 160)
      this.scene.add(light)

      // The model has z up, so the camera has z up too. It looks from the front and above.
      this.camera = new PerspectiveCamera(35, 2, 1, 2000)
      this.camera.up.set(0, 0, 1)
      this.camera.position.set(WIDTH / 2 - 30, DEPTH / 2 - 150, PLATE_TOP + 100)
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.target.set(WIDTH / 2, DEPTH / 2, PLATE_TOP)
      this.controls.enableDamping = true
      this.controls.minDistance = 60
      this.controls.maxDistance = 500

      this.material = new MeshStandardMaterial({
        color: MODEL_COLOR,
        roughness: 0.6,
      })
      this.mesh = new Mesh(undefined, this.material)
      this.scene.add(this.mesh)

      this.resizeObserver = new ResizeObserver(this.resize)
      this.resizeObserver.observe(host)
      this.resize()
      this.renderer.setAnimationLoop(() => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
      })
    },
    resize() {
      const { clientWidth, clientHeight } = this.$refs.canvasHost
      if (!clientWidth || !clientHeight) return
      this.renderer.setSize(clientWidth, clientHeight)
      this.camera.aspect = clientWidth / clientHeight
      this.camera.updateProjectionMatrix()
    },
    rebuild() {
      clearTimeout(this.rebuildTimer)
      if (!this.font) return
      const geometry = buildPrintModel({
        cells: this.cells,
        max: this.max,
        text: this.text,
        font: this.font,
      })
      this.geometry?.dispose()
      this.geometry = geometry
      this.builtText = this.text
      if (this.mesh) this.mesh.geometry = geometry
      const kept = [...this.text].slice(0, MAX_TEXT_LENGTH).join('')
      this.unsupported = supportedText(this.text, this.font) !== kept
    },
    download() {
      // The user can click before the debounce ends, or before the watcher runs.
      // Use the text that is in the field now.
      if (this.builtText !== this.text) this.rebuild()
      const url = URL.createObjectURL(exportStl(this.geometry))
      const link = document.createElement('a')
      link.href = url
      link.download = stlFileName(this.text)
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
  },
}
</script>

<style scoped>
@reference '../assets/css/tailwind.css';

.print-button {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
