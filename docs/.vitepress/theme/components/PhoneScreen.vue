<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { openEndpoint } from '../apiPanel';
import { findEndpoint, useLang, type Endpoint } from '../endpoints';
import type { StepApi } from '../featureTypes';
import { labels } from '../labels';
import Icon from './Icon.vue';

// A phone showing the step's screen with pulsing API pins; a step without a
// screen happens on the server and shows the app talking to Supabase.
const props = defineProps<{ screen?: string; title: string; apis: StepApi[] }>();
const { lang } = useLang();
const l = computed(() => labels[lang.value]);

const pins = computed(() =>
  props.apis.flatMap((a) => {
    const endpoint = findEndpoint(a.id);
    return endpoint && a.x !== undefined && a.y !== undefined ? [{ ...a, endpoint }] : [];
  }),
);
const serverCalls = computed(() =>
  props.apis.map((a) => findEndpoint(a.id)).filter((e): e is Endpoint => !!e),
);
</script>

<template>
  <div class="phone">
    <div class="phone-screen zoomable">
      <Transition name="screen">
        <img v-if="screen" :key="screen" class="phone-img" :src="withBase(`/screens/boards/${screen}.png`)" :alt="title" />
        <div v-else :key="`server-${title}`" class="phone-server">
          <div class="server-diagram">
            <span class="server-node"><Icon name="smartphone" :size="22" /></span>
            <span class="server-wire"><i /><i /><i /></span>
            <span class="server-node server-node--db"><Icon name="server" :size="22" /></span>
          </div>
          <p class="server-kicker">{{ l.onServer }}</p>
          <p class="server-title">{{ title }}</p>
          <button
            v-for="e in serverCalls"
            :key="e.id"
            type="button"
            class="server-call"
            @click="openEndpoint(e.id)"
          >
            <b>{{ e.method }}</b> {{ e.path }}
          </button>
        </div>
      </Transition>
      <TransitionGroup name="pin">
        <button
          v-for="(p, i) in pins"
          :key="`${screen}-${p.id}`"
          type="button"
          class="pin"
          :style="{ left: `${p.x}%`, top: `${p.y}%`, '--pin-delay': `${200 + i * 120}ms` }"
          :aria-label="`${p.endpoint.method} ${p.endpoint.path}`"
          @click="openEndpoint(p.id)"
        >
          <span class="pin-ring" />
          <span class="pin-dot">API</span>
          <span class="pin-tip"><b>{{ p.endpoint.method }}</b> {{ p.endpoint.path }}</span>
        </button>
      </TransitionGroup>
    </div>
  </div>
</template>
