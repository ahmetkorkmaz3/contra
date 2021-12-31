<template>
  <div class="pt-24 flex flex-col justify-center">
    <input type="text" id="username"
           class="mb-4 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
           placeholder="ahmetkorkmaz3" required>
    <button type="button" class="bg-indigo-600 text-white text-sm leading-6 font-medium py-2 px-3 rounded-lg">Check availability</button>
  </div>
</template>

<script>
export default {
  name: 'UserInformation'
}
</script>

<style scoped>
</style>
