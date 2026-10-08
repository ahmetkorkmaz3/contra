<template>
  <div class="p-6 sm:p-8">
    <form class="space-y-6" @submit.prevent="sendUsernameData">
      <div class="space-y-5">
        <div v-for="field in fields" :key="field.id">
          <label
            :for="field.id"
            class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ field.label }}
          </label>
          <div class="relative">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <svg
                class="h-5 w-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="field.icon" />
              </svg>
            </div>
            <input
              :id="field.id"
              v-model.trim="$data[field.model]"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/60 py-2.5 pl-10 pr-3 text-gray-900 dark:text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              :placeholder="field.placeholder"
              :disabled="loading"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!githubUsername || !gitlabUsername || loading"
      >
        <template v-if="loading">
          <svg
            class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Merging contributions...
        </template>
        <span v-else>Merge Contributions</span>
      </button>

      <div
        class="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-gray-600 dark:text-gray-400"
      >
        <svg
          class="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clip-rule="evenodd"
          />
        </svg>
        <p>
          To include private GitLab contributions, enable
          <span class="text-gray-800 dark:text-gray-200"
            >“Include private contributions”</span
          >
          in your
          <a
            href="https://gitlab.com/-/profile"
            target="_blank"
            rel="noopener"
            class="font-medium text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline"
            >GitLab profile settings</a
          >.
        </p>
      </div>
    </form>
  </div>
</template>

<script>
const GITHUB_ICON =
  'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
const GITLAB_ICON =
  'M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z'

export default {
  name: 'UserInformation',
  emits: ['calculateData'],
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      githubUsername: '',
      gitlabUsername: '',
      fields: [
        {
          id: 'github-username',
          model: 'githubUsername',
          label: 'GitHub username',
          placeholder: 'octocat,other-account',
          icon: GITHUB_ICON,
        },
        {
          id: 'gitlab-username',
          model: 'gitlabUsername',
          label: 'GitLab username',
          placeholder: 'gitlab-user,other-account',
          icon: GITLAB_ICON,
        },
      ],
    }
  },
  methods: {
    sendUsernameData() {
      if (!this.githubUsername || !this.gitlabUsername) return
      this.$emit('calculateData', {
        githubUsername: this.githubUsername,
        gitlabUsername: this.gitlabUsername,
      })
    },
    sendUsernameIfProvided() {
      const { githubUsername, gitlabUsername } = this.$route.query
      if (githubUsername && gitlabUsername) {
        this.githubUsername = String(githubUsername).trim()
        this.gitlabUsername = String(gitlabUsername).trim()
        this.sendUsernameData()
      }
    },
  },
  beforeMount() {
    this.sendUsernameIfProvided()
  },
}
</script>
