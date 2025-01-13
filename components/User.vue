<template>
  <div class="flex flex-col space-y-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <ProfilePicture :githubUsername="githubUsername" />
        <div class="flex flex-col">
          <div class="text-xl font-semibold text-white">
            {{ githubUsername || gitlabUsername }}
          </div>
          <div class="text-sm text-gray-400">
            Contributions from GitHub {{ githubUsername ? '& ' : '' }}{{ gitlabUsername ? 'GitLab' : '' }}
          </div>
        </div>
      </div>
      <button @click="$emit('close')"
        class="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
        Back
      </button>
    </div>

    <div class="space-y-8">
      <!-- 2D Heatmap -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-lg font-medium text-white mb-4">2D Contribution Heatmap</h2>
        <Contributions :data="contributions" :totalContributionCount="totalContributionCount" />
      </div>

      <!-- 3D Visualization -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-lg font-medium text-white mb-4">3D Contribution Visualization</h2>
        <Contributions3D :data="contributions" :githubUsername="githubUsername" />
      </div>
    </div>
  </div>
</template>

<script>
import Contributions from './Contributions.vue'
import Contributions3D from './Contributions3D.vue'
import ProfilePicture from './ProfilePicture.vue'

export default {
  name: 'User',
  components: {
    Contributions,
    Contributions3D,
    ProfilePicture
  },
  props: {
    contributions: {
      type: Array,
      required: true
    },
    totalContributionCount: {
      type: Number,
      required: true
    },
    githubUsername: {
      type: String,
      default: ''
    },
    gitlabUsername: {
      type: String,
      default: ''
    }
  }
}
</script>
