<script setup lang="ts">
import { computed } from 'vue';
import { openEndpoint } from '../apiPanel';
import { findEndpoint, useLang } from '../endpoints';
import { labels } from '../labels';

// Inline {API} chip: <Api id="sync" />. A click opens the endpoint's details.
const props = defineProps<{ id: string }>();
const { lang } = useLang();
const l = computed(() => labels[lang.value]);
const endpoint = computed(() => findEndpoint(props.id));
</script>

<template>
  <span v-if="!endpoint" class="api-chip api-chip--missing">{{ l.unknown(id) }}</span>
  <button v-else type="button" class="api-chip" @click="openEndpoint(endpoint.id)">
    <span class="api-chip-tag">API</span>
    <span class="api-chip-method">{{ endpoint.method }}</span>
    <span class="api-chip-path">{{ endpoint.path }}</span>
  </button>
</template>
