<template>
  <div class="relative p-4 sm:p-6">
    <button 
      @click="$emit('close')" 
      class="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
      aria-label="Close"
    >
      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div class="flex flex-col items-center">
      <div class="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-full">
          <svg class="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <ProfilePicture 
          v-else 
          :url="profilePictureUrl" 
          class="w-full h-full rounded-full shadow-lg ring-2 ring-gray-600"
        />
      </div>
      
      <div class="space-y-6 w-full">
        <div class="flex flex-wrap justify-center gap-4">
          <a 
            :href="`https://github.com/${githubUsername}`" 
            target="_blank" 
            class="flex items-center px-4 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="ml-2 text-white font-medium">{{ githubUsername }}</span>
          </a>

          <a 
            :href="`https://gitlab.com/${gitlabUsername}`" 
            target="_blank" 
            class="flex items-center px-4 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
            </svg>
            <span class="ml-2 text-white font-medium">{{ gitlabUsername }}</span>
          </a>
        </div>

        <div class="bg-gray-700/30 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-gray-600/50">
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1">{{ totalContributionCount }}</div>
            <div class="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Contributions</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-800/50 rounded-lg p-2 sm:p-4 shadow-inner">
      <Contributions 
        :data="contributions" 
        :totalContributionCount="totalContributionCount"
        class="w-full transform origin-left"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'User',
  props: {
    contributions: {
      type: Array,
      required: true
    },
    githubUsername: {
      type: String,
      required: true,
    },
    gitlabUsername: {
      type: String,
      required: true,
    },
    totalContributionCount: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      profilePictureUrl: '',
      loading: true,
      error: null
    }
  },
  async mounted() {
    try {
      await this.getGithubProfilePicture()
    } catch (err) {
      this.error = 'Failed to load profile picture'
      console.error(err)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async getGithubProfilePicture() {
      const res = await this.$axios.get(`https://api.github.com/users/${this.githubUsername}`)
      this.profilePictureUrl = res.data.avatar_url
    }
  }
}
</script>
