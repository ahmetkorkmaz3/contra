<template>
  <div class="antialiased text-gray-400 bg-gray-900 h-screen flex flex-col justify-center px-56">
    <UserInformation @calculateData="calculateGraph" />
    <Contributions :data="contributions" />
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      contributions: null,
    };
  },
  methods: {
    calculateGraph({ githubUsername, gitlabUsername }) {
      this.$axios
        .get(`${process.env.API_URL}/contributions?githubUsername=${githubUsername}&gitlabUsername=${gitlabUsername}`)
        .then(res => {
          this.contributions = res.data.data
        })
    },
  }
}
</script>
