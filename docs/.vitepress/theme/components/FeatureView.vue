<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';
import { accentStyle } from '../accents';
import { findEndpoint, useLang, type Endpoint } from '../endpoints';
import { featureEndpointIds, type FeatureFrontmatter } from '../featureTypes';
import { inline } from '../inline';
import { labels } from '../labels';
import EndpointDetails from './EndpointDetails.vue';
import FeatureNav from './FeatureNav.vue';
import FlowPlayer from './FlowPlayer.vue';
import Icon from './Icon.vue';

// A feature page: the feature list on the left, the feature on the right in
// tabs. Everything comes from the page's frontmatter except Technical, which
// is the Markdown body of the page (the default slot).
type Tab = 'overview' | 'flows' | 'technical' | 'api';
const TABS: { key: Tab; icon: string }[] = [
  { key: 'overview', icon: 'file-text' },
  { key: 'flows', icon: 'route' },
  { key: 'technical', icon: 'code' },
  { key: 'api', icon: 'plug' },
];

const { frontmatter } = useData();
const { lang } = useLang();
const l = computed(() => labels[lang.value]);
const fm = computed(() => frontmatter.value as FeatureFrontmatter);

const tab = ref<Tab>('overview');
// The tab from the URL is shown without animation; later switches animate.
const animated = ref(false);
const openApi = ref<string | null>(null);

const endpoints = computed(() =>
  featureEndpointIds(fm.value)
    .map(findEndpoint)
    .filter((e): e is Endpoint => !!e),
);
const stepCount = computed(() => (fm.value.flows ?? []).reduce((n, f) => n + f.steps.length, 0));

// The URL hash keeps the tab and, on Flows, the flow and step: #flows/email/2.
const flowStart = ref<{ flow?: string; step?: number }>({});

const setHash = (hash: string) => history.replaceState(history.state, '', `#${hash}`);
const setTab = (key: Tab) => {
  tab.value = key;
  setHash(key);
};
const onFlowChange = (flow: string, step: number) => setHash(`flows/${flow}/${step + 1}`);

const readHash = () => {
  const [key, flow, step] = location.hash.slice(1).split('/');
  tab.value = TABS.some((t) => t.key === key) ? (key as Tab) : 'overview';
  flowStart.value = { flow, step: step ? Number(step) - 1 : 0 };
};
onMounted(async () => {
  readHash();
  await nextTick();
  animated.value = true;
});
watch(
  () => fm.value.feature,
  async () => {
    animated.value = false;
    readHash();
    openApi.value = null;
    await nextTick();
    animated.value = true;
  },
);
</script>

<template>
  <div class="explorer" :style="accentStyle(fm.accent)">
    <aside class="explorer-nav">
      <FeatureNav />
    </aside>

    <section class="feature-main">
      <header class="feature-hero">
        <div class="feature-glow" />
        <span class="feature-icon"><Icon :name="fm.icon" :size="26" /></span>
        <div class="feature-head">
          <p class="feature-kicker">{{ l.featureGroups[fm.group] ?? fm.group }}</p>
          <h1 class="feature-title">{{ fm.title }}</h1>
          <p class="feature-summary" v-html="inline(fm.summary)" />
          <div class="feature-stats">
            <span><Icon name="route" :size="14" /> {{ fm.flows?.length ?? 0 }} × {{ l.tabs.flows.toLowerCase() }}</span>
            <span><Icon name="git-branch" :size="14" /> {{ l.stepsCount(stepCount) }}</span>
            <span><Icon name="plug" :size="14" /> {{ l.endpointsCount(endpoints.length) }}</span>
          </div>
        </div>
      </header>

      <div class="feature-tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="tab === t.key"
          class="feature-tab"
          :class="{ active: tab === t.key }"
          @click="setTab(t.key)"
        >
          <Icon :name="t.icon" :size="16" />
          {{ l.tabs[t.key] }}
          <span v-if="t.key === 'api'" class="tab-count">{{ endpoints.length }}</span>
        </button>
      </div>

      <Transition name="tab" :css="animated">
        <!-- Overview -->
        <div v-if="tab === 'overview'" key="overview" class="tab-body overview">
          <div class="ov-card ov-purpose">
            <h2>{{ l.purpose }}</h2>
            <p v-html="inline(fm.purpose)" />
          </div>

          <div v-if="fm.who?.length" class="ov-section">
            <h2>{{ l.who }}</h2>
            <div class="who-grid">
              <div v-for="w in fm.who" :key="w.role" class="who-card">
                <p class="who-role" v-html="inline(w.role)" />
                <p class="who-outcome"><Icon name="arrow-right" :size="14" /> <span v-html="inline(w.outcome)" /></p>
              </div>
            </div>
          </div>

          <div v-if="fm.rules?.length" class="ov-section">
            <h2>{{ l.rules }}</h2>
            <ul class="rules">
              <li v-for="(r, i) in fm.rules" :key="i" v-html="inline(r)" />
            </ul>
          </div>

          <div v-if="fm.messages?.length" class="ov-section">
            <h2>{{ l.messages }}</h2>
            <div class="messages">
              <div v-for="(m, i) in fm.messages" :key="i" class="message">
                <p class="message-situation" v-html="inline(m.situation)" />
                <div class="message-banner">
                  <span class="message-icon">!</span>
                  <div>
                    <p v-if="m.title" class="message-title">{{ m.title }}</p>
                    <p class="message-text">{{ m.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="fm.screens?.length" class="ov-section">
            <h2>{{ l.appScreens }}</h2>
            <div class="screens zoomable">
              <figure v-for="s in fm.screens" :key="s.src">
                <img :src="withBase(s.src)" :alt="s.caption" />
                <figcaption>{{ s.caption }}</figcaption>
              </figure>
            </div>
          </div>
        </div>

        <!-- Flows -->
        <div v-else-if="tab === 'flows'" key="flows" class="tab-body">
          <FlowPlayer
            v-if="fm.flows?.length"
            :key="fm.feature"
            :flows="fm.flows"
            :feature="fm.feature"
            :start="flowStart"
            @change="onFlowChange"
          />
          <p class="flow-note">{{ l.boardNote }}</p>
        </div>

        <!-- Technical: the Markdown body of the page -->
        <div v-else-if="tab === 'technical'" key="technical" class="tab-body vp-doc technical">
          <slot />
        </div>

        <!-- API -->
        <div v-else key="api" class="tab-body api-list">
          <div v-for="e in endpoints" :key="e.id" class="api-row" :class="{ open: openApi === e.id }">
            <button type="button" class="api-row-head" @click="openApi = openApi === e.id ? null : e.id">
              <span class="ep-method" :data-method="e.method">{{ e.method }}</span>
              <code class="api-row-path">{{ e.path }}</code>
              <span class="api-row-summary">{{ e.summary[lang].replace(/`/g, '') }}</span>
              <Icon name="chevron-down" :size="18" class="api-row-chevron" />
            </button>
            <Transition name="expand">
              <div v-if="openApi === e.id" class="api-row-body">
                <EndpointDetails :endpoint="e" compact />
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>
