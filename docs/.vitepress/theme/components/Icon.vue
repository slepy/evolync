<script setup lang="ts">
import { computed } from 'vue';

// Lucide icon paths (24×24, stroke), the same icon set the app uses.
const paths: Record<string, string[]> = {
  'log-in': ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'm10 17 5-5-5-5', 'M15 12H3'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  'user-plus': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8', 'M19 8v6', 'M22 11h-6'],
  key: [
    'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
    'M16.5 7a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1',
  ],
  ticket: [
    'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
    'M13 5v2',
    'M13 17v2',
    'M13 11v2',
  ],
  server: [
    'M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z',
    'M6 6h.01',
    'M6 18h.01',
  ],
  smartphone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  play: ['M6 3 20 12 6 21 6 3'],
  pause: ['M14 4h4v16h-4z', 'M6 4h4v16H6z'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  search: ['m21 21-4.3-4.3', 'M11 3a8 8 0 1 0 0 16a8 8 0 0 0 0-16'],
  'file-text': [
    'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
    'M14 2v4a2 2 0 0 0 2 2h4',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8',
  ],
  route: ['M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15', 'M6 16a3 3 0 1 0 0 6a3 3 0 0 0 0-6', 'M18 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6'],
  code: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
  plug: ['M12 22v-5', 'M9 8V2', 'M15 8V2', 'M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z'],
  'git-branch': ['M6 3v12', 'M18 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6', 'M6 15a3 3 0 1 0 0 6a3 3 0 0 0 0-6', 'M18 9a9 9 0 0 1-9 9'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
};

const props = withDefaults(defineProps<{ name: string; size?: number; stroke?: number }>(), { size: 18, stroke: 2 });
const d = computed(() => paths[props.name] ?? []);
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="p in d" :key="p" :d="p" />
  </svg>
</template>
