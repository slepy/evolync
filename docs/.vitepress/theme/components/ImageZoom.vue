<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

// A click on a screenshot opens it large; a click anywhere or Escape closes it.
const image = ref<{ src: string; alt: string } | null>(null);

const onClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target instanceof HTMLImageElement && target.closest('.zoomable')) {
    image.value = { src: target.currentSrc || target.src, alt: target.alt };
  }
};
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') image.value = null;
};

onMounted(() => {
  document.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onClick);
  window.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="zoom" :duration="{ enter: 340, leave: 220 }">
      <div v-if="image" class="zoom-overlay" @click="image = null">
        <figure class="zoom-figure">
          <img :src="image.src" :alt="image.alt" />
          <figcaption>{{ image.alt }}</figcaption>
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>
