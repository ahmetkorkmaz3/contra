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
      :dark-mode="theme === 'dark'"
    />
  </div>
</template>

<script>
import { CalendarHeatmap } from 'vue3-calendar-heatmap'
import 'vue3-calendar-heatmap/dist/style.css'
import { HEATMAP_COLORS } from '~/utils/heatmapColors'

export default {
  name: 'Contributions',
  setup() {
    return { theme: useTheme().theme }
  },
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
    }
  },
  computed: {
    // CalendarHeatmap needs 6 colors. Index 0 is "no data", and it uses the empty color.
    rangeColors() {
      const colors = HEATMAP_COLORS[this.theme]
      return [colors[0], ...colors]
    },
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
.contra-heatmap :deep(svg.vch__wrapper text) {
  fill: var(--heatmap-label);
}
.contra-heatmap :deep(.vch__legend) {
  color: var(--heatmap-label);
  font-size: 0.75rem;
}
</style>
