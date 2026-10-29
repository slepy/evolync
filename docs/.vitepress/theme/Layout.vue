<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import ApiPanel from './components/ApiPanel.vue';
import ImageZoom from './components/ImageZoom.vue';
import { animatePageEnter, revealOnScroll } from './motion';

const route = useRoute();

const onPageShown = async () => {
  await nextTick();
  animatePageEnter();
  revealOnScroll();
};

onMounted(onPageShown);
watch(() => route.path, onPageShown);
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <ApiPanel />
      <ImageZoom />
    </template>
  </DefaultTheme.Layout>
</template>
