<template>
  <div class="flex">
    <calendar-heatmap v-if="data !== null" class="w-full" :values="data" :end-date="Date.now()" :range-color="rangeColors" />
  </div>
</template>

<script>
import { CalendarHeatmap } from 'vue-calendar-heatmap'

export default {
  name: 'Contributions',
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      rangeColors: ['#161b22', '#0e4429', '#006d33', '#26a642', '#39d353'],
    };
  },
  components: {
    CalendarHeatmap,
  },
}
</script>

<style scoped>

</style>
