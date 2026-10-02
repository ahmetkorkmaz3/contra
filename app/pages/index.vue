<template>
  <div class="relative min-h-screen overflow-hidden bg-gray-950 text-gray-100">
    <div
      class="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_60%)]"
      aria-hidden="true"
    ></div>

    <ForkMeOnGithub />

    <main
      class="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <header class="mb-10 text-center sm:mb-12">
        <div
          class="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
          GitHub + GitLab
        </div>
        <h1
          class="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          Contribution Graph Merger
        </h1>
        <p class="mx-auto max-w-2xl text-base text-gray-400 sm:text-lg">
          Merge your GitHub and GitLab contributions into one graph. Share it
          with a single link.
        </p>
      </header>

      <div
        class="mx-auto w-full transition-[max-width] duration-300"
        :class="contributions === null ? 'max-w-lg' : 'max-w-4xl'"
      >
        <div
          v-if="error"
          role="alert"
          class="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <svg
            class="mt-0.5 h-5 w-5 shrink-0 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="flex-1">{{ error }}</p>
          <button
            type="button"
            class="rounded-md p-0.5 text-red-300 hover:bg-red-500/20 hover:text-red-100"
            aria-label="Dismiss error"
            @click="error = null"
          >
            <svg
              class="h-4 w-4"
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
          class="rounded-2xl border border-gray-800 bg-gray-900/80 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <UserInformation
            v-if="contributions === null"
            :loading="loading"
            @calculateData="calculateGraph"
          />
          <User
            v-else
            :contributions="contributions"
            :githubUsername="githubUsername"
            :gitlabUsername="gitlabUsername"
            :totalContributionCount="totalContributionCount"
            @close="back"
          />
        </div>
      </div>

      <footer class="mt-auto pt-12 text-center text-xs text-gray-500">
        Data comes from the public GitHub and GitLab profiles.
        <a
          href="https://github.com/ahmetkorkmaz3/contra"
          target="_blank"
          rel="noopener"
          class="text-gray-400 underline-offset-4 hover:text-gray-200 hover:underline"
        >
          Source on GitHub
        </a>
      </footer>
    </main>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      contributions: null,
      totalContributionCount: null,
      githubUsername: '',
      gitlabUsername: '',
      loading: false,
      error: null,
    }
  },
  methods: {
    async calculateGraph({ githubUsername, gitlabUsername }) {
      this.loading = true
      this.error = null
      try {
        const res = await $fetch(
          `${this.$config.public.apiUrl}/contributions`,
          {
            query: { githubUsername, gitlabUsername },
          },
        )
        this.contributions = res.data.contributions
        this.totalContributionCount = res.data.totalContributionCount
        this.githubUsername = githubUsername
        this.gitlabUsername = gitlabUsername
        // Keep the URL shareable: it reopens this result.
        this.$router.replace({ query: { githubUsername, gitlabUsername } })
      } catch (err) {
        this.error =
          'Could not get the contribution data. Check the usernames and try again.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    async back() {
      // Clear the query first. Otherwise the form reads it on mount and submits again.
      await this.$router.replace({ query: {} })
      this.contributions = null
      this.error = null
    },
  },
}
</script>
