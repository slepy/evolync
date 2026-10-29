<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { accentStyle } from '../accents';
import { useLang } from '../endpoints';
import { data as allFeatures } from '../features.data';
import { labels } from '../labels';
import { matches } from '../search';
import Icon from './Icon.vue';

// Left column of the explorer: every feature of the current language, by group.
const GROUP_ORDER = ['account', 'school'];

const { lang } = useLang();
const { frontmatter } = useData();
const l = computed(() => labels[lang.value]);
const query = ref('');

const groups = computed(() => {
  const features = allFeatures.filter(
    (f) => f.lang === lang.value && matches([f.title, f.summary], query.value),
  );
  const keys = [...new Set([...GROUP_ORDER, ...features.map((f) => f.group)])];
  return keys
    .map((group) => ({ group, items: features.filter((f) => f.group === group) }))
    .filter((g) => g.items.length);
});
</script>

<template>
  <nav class="fnav" :aria-label="l.tabs.overview">
    <label class="fnav-search">
      <Icon name="search" :size="16" />
      <input v-model="query" type="search" :placeholder="l.searchFeatures" />
    </label>
    <div v-for="g in groups" :key="g.group" class="fnav-group">
      <p class="fnav-group-title">{{ l.featureGroups[g.group] ?? g.group }}</p>
      <a
        v-for="f in g.items"
        :key="f.feature"
        :href="withBase(f.link)"
        class="fnav-item"
        :class="{ active: f.feature === frontmatter.feature }"
        :style="accentStyle(f.accent)"
      >
        <span class="fnav-icon"><Icon :name="f.icon" :size="16" /></span>
        <span class="fnav-text">
          <span class="fnav-title">{{ f.title }}</span>
          <span class="fnav-summary">{{ l.stepsCount(f.steps) }} · {{ l.endpointsCount(f.endpoints) }}</span>
        </span>
      </a>
    </div>
  </nav>
</template>
