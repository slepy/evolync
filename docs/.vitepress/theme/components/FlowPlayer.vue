<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useLang } from '../endpoints';
import type { Flow } from '../featureTypes';
import { inline } from '../inline';
import { labels } from '../labels';
import Api from './Api.vue';
import Icon from './Icon.vue';
import PhoneScreen from './PhoneScreen.vue';

// Flow walkthrough: pick a flow, click through its steps; the phone shows the
// screen of each step with its API pins, the side card explains it.
const AUTOPLAY_MS = 4000;

const props = defineProps<{ flows: Flow[]; feature: string; start?: { flow?: string; step?: number } }>();
const emit = defineEmits<{ change: [flow: string, step: number] }>();
const { lang } = useLang();
const l = computed(() => labels[lang.value]);

const startFlow = Math.max(0, props.flows.findIndex((f) => f.id === props.start?.flow));
const flowIndex = ref(startFlow);
const stepIndex = ref(Math.min(Math.max(0, props.start?.step ?? 0), props.flows[startFlow].steps.length - 1));
const playing = ref(false);
const showDiagram = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const flow = computed(() => props.flows[flowIndex.value]);
const step = computed(() => flow.value.steps[stepIndex.value]);
const total = computed(() => flow.value.steps.length);

const go = (index: number) => {
  stepIndex.value = (index + total.value) % total.value;
};
const next = () => go(stepIndex.value + 1);
const previous = () => go(stepIndex.value - 1);

const stop = () => {
  playing.value = false;
  clearInterval(timer);
};
const togglePlay = () => {
  if (playing.value) return stop();
  playing.value = true;
  timer = setInterval(() => {
    if (stepIndex.value === total.value - 1) return stop();
    next();
  }, AUTOPLAY_MS);
};

const pickFlow = (index: number) => {
  stop();
  flowIndex.value = index;
  stepIndex.value = 0;
  showDiagram.value = false;
};
const pickStep = (index: number) => {
  stop();
  go(index);
};

watch([flowIndex, stepIndex], () => emit('change', flow.value.id, stepIndex.value));

const onKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest('input, textarea, [contenteditable]')) return;
  if (event.key === 'ArrowRight') {
    stop();
    next();
  } else if (event.key === 'ArrowLeft') {
    stop();
    previous();
  }
};
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  stop();
});

const progressStyle = { '--progress-ms': `${AUTOPLAY_MS}ms` };
</script>

<template>
  <div class="flow">
    <div v-if="flows.length > 1" class="flow-picker" role="tablist">
      <button
        v-for="(f, i) in flows"
        :key="f.id"
        type="button"
        role="tab"
        :aria-selected="i === flowIndex"
        class="flow-pill"
        :class="{ active: i === flowIndex }"
        @click="pickFlow(i)"
      >
        <Icon name="git-branch" :size="15" />
        {{ f.title }}
        <span class="flow-pill-count">{{ f.steps.length }}</span>
      </button>
    </div>

    <div class="flow-stage">
      <ol class="flow-steps">
        <li
          v-for="(s, i) in flow.steps"
          :key="`${flow.id}-${i}`"
          :class="{ active: i === stepIndex, done: i < stepIndex }"
        >
          <button type="button" @click="pickStep(i)">
            <span class="flow-num">{{ i + 1 }}</span>
            <span class="flow-step-text">
              <span class="flow-step-title">{{ s.title }}</span>
              <span v-if="s.api?.length" class="flow-step-api">
                <span class="mini-tag">API</span> × {{ s.api.length }}
              </span>
            </span>
          </button>
        </li>
      </ol>

      <PhoneScreen :screen="step.screen" :title="step.title" :apis="step.api ?? []" />

      <div class="flow-detail">
        <Transition name="detail">
          <div :key="`${flow.id}-${stepIndex}`" class="flow-card">
            <p class="flow-kicker">{{ l.step(stepIndex + 1, total) }}</p>
            <h3 class="flow-title">{{ step.title }}</h3>
            <p class="flow-text" v-html="inline(step.text)" />
            <div v-if="step.api?.length" class="flow-apis">
              <Api v-for="a in step.api" :id="a.id" :key="a.id" />
            </div>
            <p v-else class="flow-noapi">{{ l.noApi }}</p>
          </div>
        </Transition>

        <div class="flow-controls">
          <button type="button" class="ctrl" :aria-label="l.previous" @click="pickStep(stepIndex - 1)">
            <Icon name="chevron-left" />
          </button>
          <button type="button" class="ctrl ctrl--play" :aria-label="playing ? l.pause : l.play" @click="togglePlay">
            <Icon :name="playing ? 'pause' : 'play'" :size="16" />
            {{ playing ? l.pause : l.play }}
          </button>
          <button type="button" class="ctrl" :aria-label="l.next" @click="pickStep(stepIndex + 1)">
            <Icon name="chevron-right" />
          </button>
        </div>
        <div class="flow-progress" :class="{ playing }" :style="progressStyle">
          <span
            v-for="(s, i) in flow.steps"
            :key="i"
            :class="{ done: i < stepIndex, current: i === stepIndex }"
            @click="pickStep(i)"
          />
        </div>
        <p class="flow-keys">{{ l.keys }}</p>
      </div>
    </div>

    <div v-if="flow.diagram" class="flow-diagram">
      <button type="button" class="diagram-toggle" :aria-expanded="showDiagram" @click="showDiagram = !showDiagram">
        <Icon name="route" :size="16" />
        {{ showDiagram ? l.hideDiagram : l.showDiagram }}
        <Icon name="chevron-down" :size="16" :class="{ flipped: showDiagram }" />
      </button>
      <Transition name="expand">
        <div v-if="showDiagram" class="diagram-body">
          <Mermaid :id="`mermaid-${feature}-${flow.id}`" :graph="encodeURIComponent(flow.diagram)" />
        </div>
      </Transition>
    </div>
  </div>
</template>
