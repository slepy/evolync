<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { useLang, type Endpoint } from '../endpoints';
import { inline } from '../inline';
import { labels } from '../labels';

// `compact` leaves out method + path when a row header already shows them.
const props = defineProps<{ endpoint: Endpoint; compact?: boolean }>();
const { lang, prefix } = useLang();
const l = computed(() => labels[lang.value]);
const e = computed(() => props.endpoint);
</script>

<template>
  <div class="ep">
    <div v-if="!compact" class="ep-head">
      <span class="ep-method" :data-method="e.method">{{ e.method }}</span>
      <code class="ep-path">{{ e.path }}</code>
    </div>
    <p class="ep-summary" v-html="inline(e.summary[lang])" />

    <dl class="ep-meta">
      <dt>{{ l.call }}</dt>
      <dd><code>{{ e.call }}</code></dd>
      <dt>{{ l.auth }}</dt>
      <dd>{{ e.auth[lang] }}</dd>
      <template v-if="e.features.length">
        <dt>{{ l.usedIn }}</dt>
        <dd>
          <a v-for="f in e.features" :key="f" class="ep-feature" :href="withBase(`${prefix}features/${f}`)">
            {{ l.features[f] ?? f }}
          </a>
        </dd>
      </template>
      <dt>{{ l.source }}</dt>
      <dd>
        <code v-for="s in e.source" :key="s" class="ep-source">{{ s }}</code>
      </dd>
    </dl>

    <template v-if="e.request">
      <h4>{{ l.request }}</h4>
      <pre class="ep-code"><code>{{ e.request }}</code></pre>
    </template>
    <template v-if="e.response">
      <h4>{{ l.response }}</h4>
      <pre class="ep-code"><code>{{ e.response }}</code></pre>
    </template>
    <template v-if="e.notes">
      <h4>{{ l.notes }}</h4>
      <p class="ep-notes" v-html="inline(e.notes[lang])" />
    </template>
  </div>
</template>
