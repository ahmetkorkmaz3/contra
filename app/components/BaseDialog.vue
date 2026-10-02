<template>
  <Teleport to="body">
    <!-- Close only when the press and the release are both on the backdrop.
         A text selection or a drag that ends here does not close the dialog. -->
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 dark:bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      @pointerdown="pressedBackdrop = $event.target === $event.currentTarget"
      @click="closeFromBackdrop"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2
            :id="titleId"
            class="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {{ title }}
          </h2>
          <button
            ref="closeButton"
            type="button"
            class="rounded-lg p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script>
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default {
  name: 'BaseDialog',
  emits: ['close'],
  props: {
    title: {
      type: String,
      required: true,
    },
    titleId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      pressedBackdrop: false,
    }
  },
  mounted() {
    // Focus goes back here when the dialog closes.
    this.opener = document.activeElement
    this.$refs.closeButton.focus()
    document.addEventListener('keydown', this.onKeydown)
    document.body.style.overflow = 'hidden'
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    document.body.style.overflow = ''
    this.opener?.focus?.()
  },
  methods: {
    closeFromBackdrop(event) {
      if (this.pressedBackdrop && event.target === event.currentTarget) {
        this.$emit('close')
      }
      this.pressedBackdrop = false
    },
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close')
      else if (event.key === 'Tab') this.trapFocus(event)
    },
    // Tab and Shift+Tab go around the controls of the dialog, not the page behind it.
    trapFocus(event) {
      const panel = this.$refs.panel
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.getClientRects().length > 0,
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!panel.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
  },
}
</script>
