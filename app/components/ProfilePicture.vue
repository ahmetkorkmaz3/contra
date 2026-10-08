<template>
  <div
    class="relative overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
  >
    <div
      v-if="loading"
      class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700"
    ></div>
    <img
      v-else-if="url && !failed"
      :src="url"
      :alt="alt"
      class="h-full w-full object-cover"
      @error="failed = true"
    />
    <svg
      v-else
      class="h-full w-full p-3 text-gray-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'ProfilePicture',
  props: {
    url: {
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: 'Profile picture',
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      failed: false,
    }
  },
  watch: {
    url() {
      this.failed = false
    },
  },
}
</script>
