<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { endpoints, groupOrder, useLang } from '../endpoints';
import { labels } from '../labels';
import { matches } from '../search';
import EndpointDetails from './EndpointDetails.vue';
import Icon from './Icon.vue';

// The Endpoints tab: every endpoint from api/endpoints.json, grouped by kind,
// collapsed to method + path; a click opens the details. A link with #id
// (from the API panel) opens that endpoint and scrolls to it.
const { lang } = useLang();
const l = computed(() => labels[lang.value]);
const query = ref('');
const open = ref(new Set<string>());

const toggle = (id: string) => {
  const next = new Set(open.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  open.value = next;
};

const groups = computed(() => {
  const found = endpoints.filter((e) => matches([e.id, e.path, e.call, e.summary[lang.value]], query.value));
  return groupOrder
    .map((group) => ({ group, items: found.filter((e) => e.group === group) }))
    .filter((g) => g.items.length);
});

onMounted(async () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!endpoints.some((e) => e.id === id)) return;
  open.value = new Set([id]);
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ block: 'start' });
});
</script>

<template>
  <div class="ep-list">
    <input v-model="query" class="ep-search" type="search" :placeholder="l.search" />
    <p v-if="!groups.length">{{ l.noResults }}</p>
    <TransitionGroup name="ep" tag="div">
      <section v-for="g in groups" :key="g.group">
        <h2 :id="`group-${g.group}`">{{ l.groups[g.group] }}</h2>
        <TransitionGroup name="ep" tag="div" class="api-list">
          <article v-for="e in g.items" :id="e.id" :key="e.id" class="api-row ep-row" :class="{ open: open.has(e.id) }">
            <button type="button" class="api-row-head" :aria-expanded="open.has(e.id)" @click="toggle(e.id)">
              <span class="ep-method" :data-method="e.method">{{ e.method }}</span>
              <code class="api-row-path">{{ e.path }}</code>
              <span class="api-row-summary">{{ e.summary[lang].replace(/`/g, '') }}</span>
              <Icon name="chevron-down" :size="18" class="api-row-chevron" />
            </button>
            <Transition name="expand">
              <div v-if="open.has(e.id)" class="api-row-body">
                <EndpointDetails :endpoint="e" compact />
              </div>
            </Transition>
          </article>
        </TransitionGroup>
      </section>
    </TransitionGroup>
  </div>
</template>
