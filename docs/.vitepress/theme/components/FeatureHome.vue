<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { accentStyle } from '../accents';
import { endpoints, useLang } from '../endpoints';
import { data as allFeatures } from '../features.data';
import { labels } from '../labels';
import Icon from './Icon.vue';

// Home page: what the docs are, then every feature as a card, by group.
const GROUP_ORDER = ['account', 'school'];

const { lang, prefix } = useLang();
const l = computed(() => labels[lang.value]);

const groups = computed(() => {
  const features = allFeatures.filter((f) => f.lang === lang.value);
  const keys = [...new Set([...GROUP_ORDER, ...features.map((f) => f.group)])];
  return keys
    .map((group) => ({ group, items: features.filter((f) => f.group === group) }))
    .filter((g) => g.items.length);
});
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <div class="home-glow" />
      <img class="home-logo" :src="withBase('/logo.svg')" alt="" />
      <h1>{{ l.homeTitle }}</h1>
      <p>{{ l.homeText }}</p>
    </header>

    <section v-for="g in groups" :key="g.group" class="home-group">
      <h2>{{ l.featureGroups[g.group] ?? g.group }}</h2>
      <div class="home-grid">
        <a
          v-for="f in g.items"
          :key="f.feature"
          :href="withBase(f.link)"
          class="home-card"
          :style="accentStyle(f.accent)"
        >
          <span class="home-card-icon"><Icon :name="f.icon" :size="22" /></span>
          <span class="home-card-title">{{ f.title }}</span>
          <span class="home-card-summary">{{ f.summary }}</span>
          <span class="home-card-meta">
            <span>{{ l.stepsCount(f.steps) }}</span>
            <span>{{ l.endpointsCount(f.endpoints) }}</span>
            <span class="home-card-open">{{ l.openFeature }} <Icon name="arrow-right" :size="14" /></span>
          </span>
        </a>
      </div>
    </section>

    <section class="home-group">
      <h2>API</h2>
      <a :href="withBase(`${prefix}endpoints`)" class="home-card home-card--wide" :style="accentStyle('student')">
        <span class="home-card-icon"><Icon name="plug" :size="22" /></span>
        <span class="home-card-title">{{ l.allEndpoints }}</span>
        <span class="home-card-meta">
          <span>{{ l.endpointsCount(endpoints.length) }}</span>
          <span class="home-card-open">{{ l.openFeature }} <Icon name="arrow-right" :size="14" /></span>
        </span>
      </a>
    </section>
  </div>
</template>
