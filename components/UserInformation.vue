<template>
  <div class="flex flex-col mb-16">
    <div class="inputs flex flex-row">
      <input type="text" id="github-username" v-model="githubUsername"
             v-on:keyup.enter="sendUsernameData"
             class="mb-4 mr-4 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
             placeholder="GitHub Username" required>

      <input type="text" id="gitlab-username" v-model="gitlabUsername"
             v-on:keyup.enter="sendUsernameData"
             class="mb-4 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
             placeholder="Gitlab Username" required>
    </div>

    <button type="button"
            @click="sendUsernameData"
            class='bg-indigo-600 text-white text-sm leading-6 font-medium py-2 px-3 rounded-lg'>Merge your graph
    </button>
  </div>
</template>

<script>
export default {
  name: 'UserInformation',
  data() {
    return {
      githubUsername: '',
      gitlabUsername: '',
    };
  },
  methods: {
    sendUsernameData() {
      this.$emit('calculateData', { githubUsername: this.githubUsername, gitlabUsername: this.gitlabUsername });
    }
  }
}
</script>
