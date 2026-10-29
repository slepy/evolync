import { createContentLoader } from 'vitepress';
import { featureEndpointIds } from './featureTypes';

// Every feature page of every language, for the feature list and the home page.

export interface FeatureSummary {
  lang: string;
  feature: string;
  title: string;
  group: string;
  accent: string;
  icon: string;
  summary: string;
  order: number;
  link: string;
  flows: number;
  steps: number;
  endpoints: number;
}

declare const data: FeatureSummary[];
export { data };

export default createContentLoader('*/features/*.md', {
  transform(pages): FeatureSummary[] {
    return pages
      .map(({ url, frontmatter }) => {
        // English may come back as /en/… or rewritten to /…; the others always carry their prefix.
        const prefix = url.split('/')[1];
        const lang = prefix === 'pl' || prefix === 'hu' ? prefix : 'en';
        const feature = frontmatter.feature as string;
        return {
          lang,
          feature,
          title: frontmatter.title,
          group: frontmatter.group,
          accent: frontmatter.accent,
          icon: frontmatter.icon,
          summary: frontmatter.summary,
          order: frontmatter.order ?? 99,
          link: lang === 'en' ? `/features/${feature}` : `/${lang}/features/${feature}`,
          flows: frontmatter.flows?.length ?? 0,
          steps: (frontmatter.flows ?? []).reduce((n: number, f: { steps: unknown[] }) => n + f.steps.length, 0),
          endpoints: featureEndpointIds(frontmatter).length,
        };
      })
      .sort((a, b) => a.order - b.order);
  },
});
