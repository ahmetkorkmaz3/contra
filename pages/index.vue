<template>
  <div class="min-h-screen bg-gray-900">
    <ForkMeOnGithub />
    <div class="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">
          Contribution Graph Merger
        </h1>
        <p class="text-lg text-gray-300 max-w-2xl mx-auto">
          Merge and visualize your GitHub and GitLab contributions in one beautiful graph
        </p>
      </div>
      
      <div class="max-w-3xl mx-auto">
        <div class="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <UserInformation 
            v-if="contributions === null" 
            @calculateData="calculateGraph" 
            :loading="loading"
          />
          <User 
            v-else
            :contributions="contributions" 
            @close="back" 
            :githubUsername="githubUsername"
            :gitlabUsername="gitlabUsername" 
            :totalContributionCount="totalContributionCount" 
          />
        </div>

        <div v-if="error" class="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {{ error }}
        </div>
      </div>
    </div>
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
      error: null
    }
  },
  methods: {
    async calculateGraph({ githubUsername, gitlabUsername }) {
      this.loading = true
      this.error = null
      try {
        const res = await this.$axios.get(
          `${process.env.NUXT_ENV_API_URL}/contributions?githubUsername=${githubUsername}&gitlabUsername=${gitlabUsername}`
        )
        this.contributions = res.data.data.contributions
        this.totalContributionCount = res.data.data.totalContributionCount
        this.githubUsername = githubUsername
        this.gitlabUsername = gitlabUsername
      } catch (err) {
        this.error = 'Failed to fetch contribution data. Please try again.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    back() {
      this.contributions = null
      this.error = null
    }
  }
}
</script>
