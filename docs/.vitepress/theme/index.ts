import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import Layout from './Layout.vue';
import Api from './components/Api.vue';
import EndpointList from './components/EndpointList.vue';
import FeatureHome from './components/FeatureHome.vue';
import FeatureView from './components/FeatureView.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('Api', Api);
    app.component('EndpointList', EndpointList);
    app.component('FeatureView', FeatureView);
    app.component('FeatureHome', FeatureHome);
  },
} satisfies Theme;
