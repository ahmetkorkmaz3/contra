<template>
  <div class="antialiased text-gray-400 bg-gray-900 h-screen flex flex-col justify-center p-16">
    <div class="container mx-auto">
      <UserInformation v-if="contributions === null" @calculateData="calculateGraph" />
      <User :contributions="contributions" v-if="contributions !== null" @close="back" :githubUsername="githubUsername"
            :gitlabUsername="gitlabUsername" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      contributions: null,
      githubUsername: '',
      gitlabUsername: ''
    }
  },
  methods: {
    calculateGraph({ githubUsername, gitlabUsername }) {
      this.githubUsername = githubUsername
      this.gitlabUsername = gitlabUsername
      this.$axios
        .get(`${process.env.NUXT_ENV_API_URL}/contributions?githubUsername=${githubUsername}&gitlabUsername=${gitlabUsername}`)
        .then(res => {
          this.contributions = res.data.data
        })
    },
    back() {
      this.contributions = null
    }
  }
}
</script>
