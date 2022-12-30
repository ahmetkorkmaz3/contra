<template>
  <div class="antialiased text-gray-400 bg-gray-900 h-screen flex flex-col justify-center p-16">
    <ForkMeOnGithub />
    <div class="container mx-auto">
      <UserInformation v-if="contributions === null" @calculateData="calculateGraph" />
      <User :contributions="contributions" v-if="contributions !== null" @close="back" :githubUsername="githubUsername"
            :gitlabUsername="gitlabUsername" :totalContributionCount="totalContributionCount" />
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
    }
  },
  methods: {
    calculateGraph({ githubUsername, gitlabUsername }) {
      this.githubUsername = githubUsername
      this.gitlabUsername = gitlabUsername
      this.$axios
        .get(`${process.env.NUXT_ENV_API_URL}/contributions?githubUsername=${githubUsername}&gitlabUsername=${gitlabUsername}`)
        .then(res => {
          this.contributions = res.data.data.contributions
          this.totalContributionCount = res.data.data.totalContributionCount
        })
    },
    back() {
      this.contributions = null
    }
  }
}
</script>
