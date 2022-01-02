<template>
  <img :src="url" alt="ahmetkorkmaz" class="w-48 rounded-full border-2 border-gray-500 p-1">
</template>

<script>
export default {
  name: 'ProfilePicture',
  props: {
    url: {
      type: String,
      default: 'https://avatars.githubusercontent.com/u/100000000000?v=4'
    }
  }
}
</script>
