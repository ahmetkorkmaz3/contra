<template>
  <div class="p-6 sm:p-8">
    <form @submit.prevent="sendUsernameData" class="space-y-6">
      <div class="space-y-4">
        <div>
          <label for="github-username" class="label text-gray-300">GitHub Username</label>
          <div class="relative mt-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <input 
              type="text" 
              id="github-username" 
              v-model="githubUsername"
              class="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter GitHub username"
              required
            >
          </div>
        </div>

        <div>
          <label for="gitlab-username" class="label text-gray-300">GitLab Username</label>
          <div class="relative mt-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
              </svg>
            </div>
            <input 
              type="text" 
              id="gitlab-username" 
              v-model="gitlabUsername"
              class="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter GitLab username"
              required
            >
          </div>
        </div>
      </div>

      <button 
        type="submit"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!githubUsername || !gitlabUsername || loading"
      >
        <template v-if="loading">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </template>
        <span v-else>Merge Contributions</span>
      </button>

      <div class="mt-6 text-sm text-gray-400">
        <div class="flex items-center text-yellow-500 mb-2">
          <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          Important: Enable contribution visibility in GitLab
        </div>
        <a 
          href="https://gitlab.com/-/profile" 
          target="_blank" 
          class="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          GitLab Profile Settings
          <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" />
          </svg>
        </a>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'UserInformation',
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      githubUsername: '',
      gitlabUsername: ''
    }
  },
  methods: {
    async sendUsernameData() {
      if (!this.githubUsername || !this.gitlabUsername) return
      this.$emit('calculateData', { 
        githubUsername: this.githubUsername, 
        gitlabUsername: this.gitlabUsername 
      })
    },
    sendUsernameIfProvided() {
      if (this.$route.query.githubUsername && this.$route.query.gitlabUsername) {
        this.githubUsername = this.$route.query.githubUsername
        this.gitlabUsername = this.$route.query.gitlabUsername
        this.sendUsernameData()
      }
    }
  },
  beforeMount() {
    this.sendUsernameIfProvided()
  }
}
</script>
