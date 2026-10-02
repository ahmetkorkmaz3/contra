<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      @click.self="$emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 id="share-dialog-title" class="text-lg font-semibold text-white">
            Share your graph
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
          class="relative aspect-[1200/630] overflow-hidden rounded-xl border border-gray-800 bg-gray-950"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Profile card with the merged contribution graph"
            class="h-full w-full"
          />
          <div
            v-else-if="renderError"
            class="flex h-full items-center justify-center p-6 text-center text-sm text-red-300"
          >
            {{ renderError }}
          </div>
          <div v-else class="h-full w-full animate-pulse bg-gray-800/60"></div>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            :href="xUrl"
            target="_blank"
            rel="noopener"
            class="share-button bg-black text-white hover:bg-gray-950"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            Post on X
          </a>
          <a
            :href="linkedInUrl"
            target="_blank"
            rel="noopener"
            class="share-button bg-[#0a66c2] text-white hover:bg-[#0958a8]"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              />
            </svg>
            LinkedIn
          </a>
          <button
            type="button"
            class="share-button border border-gray-700 bg-gray-800 text-gray-100 hover:border-gray-500"
            :disabled="!blob"
            @click="downloadImage"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"
              />
              <path
                d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"
              />
            </svg>
            Download
          </button>
          <button
            v-if="canShareFile"
            type="button"
            class="share-button border border-gray-700 bg-gray-800 text-gray-100 hover:border-gray-500"
            :disabled="!blob"
            @click="shareImage"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z"
              />
            </svg>
            Share
          </button>
          <button
            v-else-if="canCopyImage"
            type="button"
            class="share-button border border-gray-700 bg-gray-800 text-gray-100 hover:border-gray-500"
            :disabled="!blob"
            @click="copyImage"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"
              />
              <path
                d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"
              />
            </svg>
            {{ imageCopied ? 'Copied' : 'Copy image' }}
          </button>
        </div>

        <p class="mt-3 text-xs text-gray-500">
          X and LinkedIn show your card as the link preview. Download or copy
          the image to add it to the post as a photo.
        </p>

        <div class="mt-5">
          <label
            for="share-link"
            class="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Link
          </label>
          <div class="flex gap-2">
            <input
              id="share-link"
              :value="shareUrl"
              readonly
              class="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-hidden"
              @focus="$event.target.select()"
            />
            <button
              type="button"
              class="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              @click="copyLink"
            >
              <span aria-live="polite">{{
                linkCopied ? 'Copied' : 'Copy link'
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { renderShareCard } from '~/utils/shareCard'

export default {
  name: 'ShareDialog',
  emits: ['close'],
  props: {
    // The arguments for renderShareCard(), without the host.
    card: {
      type: Object,
      required: true,
    },
    shareUrl: {
      type: String,
      required: true,
    },
    shareText: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      blob: null,
      imageUrl: '',
      renderError: '',
      linkCopied: false,
      imageCopied: false,
      canCopyImage: false,
      canShareFile: false,
    }
  },
  computed: {
    fileName() {
      return `contra-${this.card.githubUsername}.png`
    },
    xUrl() {
      const params = new URLSearchParams({
        text: this.shareText,
        url: this.shareUrl,
      })
      return `https://x.com/intent/tweet?${params}`
    },
    linkedInUrl() {
      const params = new URLSearchParams({ url: this.shareUrl })
      return `https://www.linkedin.com/sharing/share-offsite/?${params}`
    },
  },
  async mounted() {
    this.$refs.closeButton.focus()
    document.addEventListener('keydown', this.onKeydown)
    document.body.style.overflow = 'hidden'
    this.canCopyImage = Boolean(window.ClipboardItem && navigator.clipboard)

    try {
      this.blob = await renderShareCard({
        ...this.card,
        host: window.location.host,
      })
      this.imageUrl = URL.createObjectURL(this.blob)
      const file = new File([this.blob], this.fileName, { type: 'image/png' })
      this.canShareFile = Boolean(navigator.canShare?.({ files: [file] }))
    } catch (err) {
      this.renderError =
        'Could not make the image. You can still share the link.'
      console.error(err)
    }
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    document.body.style.overflow = ''
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl)
    clearTimeout(this.linkTimer)
    clearTimeout(this.imageTimer)
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close')
    },
    downloadImage() {
      const link = document.createElement('a')
      link.href = this.imageUrl
      link.download = this.fileName
      link.click()
    },
    async copyImage() {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': this.blob }),
        ])
        this.imageCopied = true
        clearTimeout(this.imageTimer)
        this.imageTimer = setTimeout(() => (this.imageCopied = false), 2000)
      } catch (err) {
        console.error(err)
      }
    },
    async shareImage() {
      const file = new File([this.blob], this.fileName, { type: 'image/png' })
      try {
        await navigator.share({
          files: [file],
          text: `${this.shareText} ${this.shareUrl}`,
        })
      } catch (err) {
        // The user closed the share sheet. This is not an error.
        if (err.name !== 'AbortError') console.error(err)
      }
    },
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.shareUrl)
        this.linkCopied = true
        clearTimeout(this.linkTimer)
        this.linkTimer = setTimeout(() => (this.linkCopied = false), 2000)
      } catch (err) {
        console.error(err)
      }
    },
  },
}
</script>

<style scoped>
@reference '../assets/css/tailwind.css';

.share-button {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
