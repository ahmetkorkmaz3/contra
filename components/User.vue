<template>
  <div class="flex flex-col justify-center items-center">
    <svg @click="$emit('close')" class="absolute top-4 left-4" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24" width="32px" height="32px">
      <path
        d="M 4.7070312 3.2929688 L 3.2929688 4.7070312 L 10.585938 12 L 3.2929688 19.292969 L 4.7070312 20.707031 L 12 13.414062 L 19.292969 20.707031 L 20.707031 19.292969 L 13.414062 12 L 20.707031 4.7070312 L 19.292969 3.2929688 L 12 10.585938 L 4.7070312 3.2929688 z" />
    </svg>
    <ProfilePicture />
    <div class="flex flex-col my-8">
      <div class="github flex justify-center items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF" width="32" height="32" viewBox="0 0 24 24">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <a href="https://github.com/ahmetkorkmaz3" class="ml-4">
          ahmetkorkmaz3
        </a>
      </div>
      <div class="gitlab flex items-center">
        <svg version="1.1" id="Layer_1" width="32" height="32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 113.2" style="enable-background:new 0 0 122.88 113.2" xml:space="preserve"><style type="text/css">.st0{fill:#EC672A;} .st1{fill:#DD3E2A;} .st2{fill:#F6A420;}</style><g><path class="st0" d="M122.65,64.72l-6.89-21.15L102.15,1.61c-0.7-2.15-3.74-2.15-4.47,0L84.06,43.54H38.81L25.19,1.61 c-0.7-2.15-3.74-2.15-4.47,0L7.13,43.54L0.24,64.72c-0.62,1.92,0.05,4.04,1.7,5.24l59.5,43.23l59.5-43.23 C122.58,68.77,123.28,66.65,122.65,64.72L122.65,64.72z"/><polygon class="st1" points="61.45,113.17 61.45,113.17 84.08,43.54 38.82,43.54 61.45,113.17 61.45,113.17"/><polygon class="st0" points="61.43,113.17 38.81,43.54 7.13,43.54 61.43,113.17 61.43,113.17"/><path class="st2" d="M7.11,43.56L7.11,43.56L0.23,64.72c-0.62,1.92,0.05,4.04,1.7,5.24l59.5,43.23L7.11,43.56L7.11,43.56 L7.11,43.56z"/><path class="st1" d="M7.12,43.56h31.71L25.18,1.63c-0.7-2.15-3.74-2.15-4.47,0L7.12,43.56L7.12,43.56L7.12,43.56z"/><polygon class="st0" points="61.45,113.17 84.08,43.54 115.79,43.54 61.45,113.17 61.45,113.17"/><path class="st2" d="M115.76,43.56L115.76,43.56l6.89,21.15c0.62,1.92-0.05,4.04-1.7,5.24l-59.5,43.21L115.76,43.56L115.76,43.56 L115.76,43.56z"/><path class="st1" d="M115.78,43.56H84.07L97.69,1.63c0.7-2.15,3.74-2.15,4.47,0L115.78,43.56L115.78,43.56L115.78,43.56z"/></g></svg>
        <a href="https://gitlab.com/ahmetkorkmaz3" class="ml-4">
          ahmetkorkmaz3
        </a>
      </div>
    </div>
    <Contributions :data="contributions" />
  </div>
</template>

<script>
export default {
  name: 'User',
  props: {
    contributions: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>

</style>
