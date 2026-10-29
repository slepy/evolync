<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { withBase } from 'vitepress';
import { closeEndpoint, openEndpointId } from '../apiPanel';
import { findEndpoint, useLang } from '../endpoints';
import { labels } from '../labels';
import EndpointDetails from './EndpointDetails.vue';

// The one endpoint details panel of the site, opened by chips and screen pins.
const { lang, prefix } = useLang();
const l = computed(() => labels[lang.value]);
const endpoint = computed(() => (openEndpointId.value ? findEndpoint(openEndpointId.value) : undefined));

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeEndpoint();
};
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="api" :duration="{ enter: 380, leave: 240 }">
      <div v-if="endpoint" class="api-overlay" @click.self="closeEndpoint">
        <div class="api-panel" role="dialog" aria-modal="true">
          <button type="button" class="api-close" :aria-label="l.close" @click="closeEndpoint">×</button>
          <EndpointDetails :key="endpoint.id" :endpoint="endpoint" />
          <a class="api-all" :href="withBase(`${prefix}endpoints#${endpoint.id}`)" @click="closeEndpoint">
            {{ l.allEndpoints }} →
          </a>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
