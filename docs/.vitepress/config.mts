import { defineConfig, type DefaultTheme } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// Every language keeps the same file tree under en/, pl/, hu/.
// English is served from the site root, the others under /pl/ and /hu/.
// Feature pages bring their own navigation (FeatureView), so there is no sidebar.

interface NavLabels {
  features: string;
  endpoints: string;
}

const nav = (prefix: string, l: NavLabels): DefaultTheme.NavItem[] => [
  { text: l.features, link: prefix, activeMatch: `^${prefix}(features/|$)` },
  { text: l.endpoints, link: `${prefix}endpoints` },
];

export default withMermaid(
  defineConfig({
    title: 'Evolync Docs',
    cleanUrls: true,
    appearance: 'force-dark',
    srcExclude: ['README.md'],
    rewrites: { 'en/:rest*': ':rest*' },
    head: [
      ['link', { rel: 'icon', href: '/logo.svg' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
      ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap' }],
    ],
    locales: {
      root: {
        label: 'English',
        lang: 'en',
        themeConfig: { nav: nav('/', { features: 'Features', endpoints: 'Endpoints' }) },
      },
      pl: {
        label: 'Polski',
        lang: 'pl',
        themeConfig: { nav: nav('/pl/', { features: 'Funkcjonalności', endpoints: 'Endpointy' }) },
      },
      hu: {
        label: 'Magyar',
        lang: 'hu',
        themeConfig: { nav: nav('/hu/', { features: 'Funkciók', endpoints: 'Végpontok' }) },
      },
    },
    themeConfig: {
      logo: '/logo.svg',
      search: { provider: 'local' },
      outline: false,
    },
    // Diagrams in the app's colors (src/core/theme/tokens.ts).
    mermaid: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        fontFamily: 'Manrope, sans-serif',
        background: '#0B0E14',
        primaryColor: '#131823',
        primaryBorderColor: '#2A3345',
        primaryTextColor: '#F4F6FA',
        secondaryColor: '#1A2130',
        tertiaryColor: '#1A2130',
        lineColor: '#7D889F',
        textColor: '#DCE2EE',
        actorBkg: '#1A2130',
        actorBorder: '#EA580C',
        actorTextColor: '#F4F6FA',
        actorLineColor: '#2A3345',
        signalColor: '#A7B1C6',
        signalTextColor: '#DCE2EE',
        noteBkgColor: 'rgba(234,88,12,0.16)',
        noteBorderColor: '#EA580C',
        noteTextColor: '#FDBA74',
        labelBoxBkgColor: '#1A2130',
        labelBoxBorderColor: '#2A3345',
        labelTextColor: '#F4F6FA',
        loopTextColor: '#A7B1C6',
        activationBkgColor: '#232B3B',
        edgeLabelBackground: '#1A2130',
        clusterBkg: '#131823',
      },
    },
  }),
);
