<template>
  <div class="antialiased text-gray-400 bg-gray-900 h-screen flex flex-col justify-center px-56">
    <UserInformation @calculateData="calculateGraph" />
    <Contributions />
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  methods: {
    calculateGraph({ githubUsername, gitlabUsername }) {
      this.getGithubContributions(githubUsername)
      this.getGitlabContributions(gitlabUsername)
    },
    getGithubContributions(username) {
      this.$axios.post('https://api.github.com/graphql', {
        query: `query {
                  user(login: "${username}"){
                    contributionsCollection {
                      contributionCalendar {
                        totalContributions
                        weeks {
                        contributionDays {
                            contributionCount
                            date
                          }
                        }
                      }
                    }
                  }
                }`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.NUXT_ENV_GITHUB_PERSONAL_KEY}`,
        }
      }).then(res => {
        console.log(res)
      })
    },
    getGitlabContributions(username) {
      this.$axios.get(`https://gitlab.com/users/${username}/calendar.json`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }).then(res => {
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
</script>
