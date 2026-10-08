<template>
  <div class="p-5 sm:p-8">
    <div
      class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-4">
        <ProfilePicture
          :url="profilePictureUrl"
          :loading="loading"
          :alt="`${avatarUsername} avatar`"
          class="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
        />
        <div class="min-w-0">
          <h2
            class="truncate text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl"
          >
            {{ profileName || avatarUsername }}
          </h2>
          <div class="mt-2 grid w-64 max-w-full grid-cols-2 gap-2">
            <a
              v-for="account in accounts"
              :key="`${account.label}-${account.username}`"
              :href="account.href"
              target="_blank"
              rel="noopener"
              class="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
              :title="`Open ${account.label} profile`"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path :d="account.icon" />
              </svg>
              <span class="truncate">{{ account.username }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white sm:flex-none"
          @click="openPrint"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75zM13.5 6.12V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25v3.37a41.4 41.4 0 017 0zm-7.538 6.83l-.54 3.512a.25.25 0 00.247.288h8.166a.25.25 0 00.247-.288l-.54-3.512a.25.25 0 00-.247-.212H6.21a.25.25 0 00-.248.212z"
              clip-rule="evenodd"
            />
          </svg>
          3D Print
        </button>
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white sm:flex-none"
          @click="shareOpen = true"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z"
            />
          </svg>
          Share
        </button>
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:flex-none"
          @click="$emit('close')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clip-rule="evenodd"
            />
          </svg>
          New search
        </button>
      </div>
    </div>

    <dl class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border p-4"
        :class="
          stat.highlight
            ? 'border-indigo-500/30 bg-indigo-500/10'
            : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40'
        "
      >
        <dt
          class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400"
        >
          {{ stat.label }}
        </dt>
        <dd
          class="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white sm:text-3xl"
        >
          {{ stat.value }}
        </dd>
        <dd v-if="stat.hint" class="mt-0.5 truncate text-xs text-gray-500">
          {{ stat.hint }}
        </dd>
      </div>
    </dl>

    <div
      class="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-3 sm:p-5"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="flex items-baseline gap-3">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Last 12 months
          </h3>
          <span v-if="view === '2d'" class="text-xs text-gray-500 sm:hidden"
            >Scroll to see all</span
          >
        </div>
        <div
          class="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-0.5"
          role="group"
          aria-label="Heatmap view"
        >
          <button
            v-for="option in viewOptions"
            :key="option"
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              view === option
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            "
            :aria-pressed="view === option"
            @click="setView(option)"
          >
            {{ option.toUpperCase() }}
          </button>
        </div>
      </div>
      <Contributions3d
        v-if="view === '3d'"
        :data="contributions"
        :totalContributionCount="totalContributionCount"
      />
      <Contributions
        v-else
        :data="contributions"
        :totalContributionCount="totalContributionCount"
      />
    </div>

    <ShareDialog
      v-if="shareOpen"
      :card="shareCard"
      :shareUrl="shareUrl"
      :shareText="shareText"
      @close="shareOpen = false"
    />
    <!-- Lazy, so three.js and the font code load only when the dialog opens. -->
    <LazyPrintDialog
      v-if="printOpen"
      :cells="calendar.cells"
      :max="calendar.max"
      :defaultText="githubUsername || gitlabUsername"
      @close="printOpen = false"
    />
  </div>
</template>

<script>
import {
  calendarCells,
  formatDay,
  formatNumber,
  getContributionStats,
} from '~/utils/contributionStats'
import { loadPrintFont } from '~/lib/printFont'

const GITHUB_ICON =
  'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
const GITLAB_ICON =
  'M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z'

const VIEW_KEY = 'contra:heatmap-view'

// The chosen view is only a convenience. Storage can be blocked, so fall back to 2D.
function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === '3d' ? '3d' : '2d'
  } catch {
    return '2d'
  }
}

export default {
  name: 'User',
  emits: ['close'],
  props: {
    contributions: {
      type: Array,
      required: true,
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
      profileName: '',
      loading: true,
      shareOpen: false,
      printOpen: false,
      viewOptions: ['2d', '3d'],
      view: readView(),
    }
  },
  computed: {
    accounts() {
      const accountsOf = (label, usernames, host, icon) =>
        usernames.split(',').map((username) => ({
          label,
          username,
          href: `https://${host}/${username}`,
          icon,
        }))
      return [
        ...accountsOf('GitHub', this.githubUsername, 'github.com', GITHUB_ICON),
        ...accountsOf('GitLab', this.gitlabUsername, 'gitlab.com', GITLAB_ICON),
      ]
    },
    avatarUsername() {
      return this.githubUsername.split(',')[0]
    },
    summary() {
      return getContributionStats(this.contributions)
    },
    calendar() {
      return calendarCells(this.contributions, Date.now())
    },
    stats() {
      const { activeDays, longestStreak, currentStreak, bestDay } = this.summary
      return [
        {
          label: 'Total contributions',
          value: formatNumber(this.totalContributionCount),
          highlight: true,
        },
        {
          label: 'Active days',
          value: formatNumber(activeDays),
        },
        {
          label: 'Longest streak',
          value: `${longestStreak}d`,
          hint: currentStreak
            ? `Current: ${currentStreak}d`
            : 'No current streak',
        },
        {
          label: 'Best day',
          value: bestDay ? formatNumber(bestDay.count) : '0',
          hint: bestDay ? formatDay(bestDay.day) : '',
        },
      ]
    },
    // /api/share gives X and LinkedIn the Open Graph tags and the card image,
    // then sends people to this result page. The SPA cannot give these tags.
    shareUrl() {
      const apiUrl = this.$config.public.apiUrl
      const url = apiUrl
        ? new URL(`${apiUrl}/share`, window.location.origin)
        : new URL(window.location.pathname, window.location.origin)
      url.searchParams.set('githubUsername', this.githubUsername)
      url.searchParams.set('gitlabUsername', this.gitlabUsername)
      return url.toString()
    },
    shareText() {
      const total = formatNumber(this.totalContributionCount)
      return `${total} contributions across GitHub and GitLab in the last 12 months, merged into one graph with contra.`
    },
    shareCard() {
      return {
        avatarUrl: this.profilePictureUrl,
        name: this.profileName,
        githubUsername: this.githubUsername,
        gitlabUsername: this.gitlabUsername,
        totalContributionCount: this.totalContributionCount,
        stats: this.summary,
      }
    },
  },
  methods: {
    openPrint() {
      // Start the font now, so it loads at the same time as the dialog code.
      // The dialog shows the error if this request fails.
      loadPrintFont().catch(() => {})
      this.printOpen = true
    },
    setView(view) {
      this.view = view
      try {
        localStorage.setItem(VIEW_KEY, view)
      } catch {
        // Ignore. The view still changes for this visit.
      }
    },
  },
  async mounted() {
    try {
      const res = await $fetch(
        `https://api.github.com/users/${this.avatarUsername}`,
      )
      this.profilePictureUrl = res.avatar_url
      this.profileName = res.name || ''
    } catch (err) {
      // The avatar is optional. ProfilePicture shows a fallback.
      console.error(err)
    } finally {
      this.loading = false
    }
  },
}
</script>
