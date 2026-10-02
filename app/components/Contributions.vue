<template>
  <!-- The heatmap SVG scales with its width. Keep a minimum width so the squares stay readable on phones. -->
  <div ref="scroller" class="-mx-1 overflow-x-auto px-1 pb-1">
    <calendar-heatmap
      v-if="data !== null"
      class="contra-heatmap min-w-[680px]"
      :values="data"
      :end-date="endDate"
      :range-color="rangeColors"
      :round="2"
      tooltip-unit="contributions"
      dark-mode
    />
  </div>
</template>

<script>
import { CalendarHeatmap } from 'vue3-calendar-heatmap'
import 'vue3-calendar-heatmap/dist/style.css'

export default {
  name: 'Contributions',
  props: {
    data: {
      type: Array,
      required: true,
    },
    totalContributionCount: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      endDate: Date.now(),
      rangeColors: [
        '#161b22',
        '#161b22',
        '#0e4429',
        '#006d32',
        '#26a641',
        '#39d353',
      ],
    }
  },
  mounted() {
    // On narrow screens, show the most recent months first.
    const scroller = this.$refs.scroller
    scroller.scrollLeft = scroller.scrollWidth
  },
  components: {
    CalendarHeatmap,
  },
}
</script>

<style scoped>
.contra-heatmap :deep(svg.vch__wrapper.dark-mode text) {
  fill: #8b949e;
}
.contra-heatmap :deep(.vch__legend) {
  color: #8b949e;
  font-size: 0.75rem;
}
</style>
