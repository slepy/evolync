// Consistency check run before every build:
// - every page exists in en/, pl/ and hu/;
// - a feature page has the same structure in every language: same group, accent,
//   icon, order, the same flows with the same steps, screens, API ids and pins,
//   the same number of rules / messages / screenshots and of ## / ### headings;
// - every screen, screenshot and endpoint id the pages name exists;
// - every endpoint has texts in all languages and links only to existing features.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const root = new URL('..', import.meta.url).pathname;
const langs = ['en', 'pl', 'hu'];
const errors = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : [];
  });

const pages = Object.fromEntries(
  langs.map((lang) => [lang, walk(join(root, lang)).map((p) => relative(join(root, lang), p)).sort()]),
);

const { endpoints } = JSON.parse(readFileSync(join(root, 'api/endpoints.json'), 'utf8'));
const endpointIds = new Set(endpoints.map((e) => e.id));

/** The language-independent shape of a page; it must be equal in every language. */
const shape = ({ data, content }) => ({
  feature: data.feature,
  group: data.group,
  accent: data.accent,
  icon: data.icon,
  order: data.order,
  who: data.who?.length ?? 0,
  rules: data.rules?.length ?? 0,
  messages: (data.messages ?? []).map((m) => Boolean(m.title)),
  screens: (data.screens ?? []).map((s) => s.src),
  api: data.api ?? [],
  flows: (data.flows ?? []).map((f) => ({
    id: f.id,
    diagram: Boolean(f.diagram),
    steps: f.steps.map((s) => ({ screen: s.screen ?? null, api: s.api ?? [] })),
  })),
  headings: (content.replace(/```[\s\S]*?```/g, '').match(/^#{2,3} /gm) ?? []).length,
});

const checkIds = (where, page) => {
  const { data, content } = page;
  const ids = [
    ...[...content.matchAll(/<Api id="([^"]+)"/g)].map((m) => m[1]),
    ...(data.api ?? []),
    ...(data.flows ?? []).flatMap((f) => f.steps.flatMap((s) => (s.api ?? []).map((a) => a.id))),
  ];
  for (const id of ids) if (!endpointIds.has(id)) errors.push(`${where}: unknown endpoint "${id}"`);
  for (const f of data.flows ?? []) {
    for (const s of f.steps) {
      if (!s.title || !s.text) errors.push(`${where}: flow ${f.id} has a step without title or text`);
      if (s.screen && !existsSync(join(root, 'public/screens/boards', `${s.screen}.png`))) {
        errors.push(`${where}: missing screen public/screens/boards/${s.screen}.png`);
      }
    }
  }
  for (const s of data.screens ?? []) {
    if (!existsSync(join(root, 'public', s.src))) errors.push(`${where}: missing screenshot public${s.src}`);
  }
};

for (const page of new Set(langs.flatMap((lang) => pages[lang]))) {
  const shapes = {};
  for (const lang of langs) {
    if (!pages[lang].includes(page)) {
      errors.push(`${lang}/${page}: missing`);
      continue;
    }
    const parsed = matter(readFileSync(join(root, lang, page), 'utf8'));
    checkIds(`${lang}/${page}`, parsed);
    shapes[lang] = JSON.stringify(shape(parsed));
  }
  const [first, ...rest] = Object.entries(shapes);
  for (const [lang, s] of rest) {
    if (s !== first[1]) errors.push(`${page}: ${lang} differs from ${first[0]} (flows, steps, screens, API, counts or headings)`);
  }
}

const featureIds = new Set(
  pages.en.filter((p) => p.startsWith('features/')).map((p) => p.replace(/^features\/|\.md$/g, '')),
);
for (const e of endpoints) {
  for (const field of ['auth', 'summary', 'notes']) {
    if (!e[field]) continue;
    for (const lang of langs) if (!e[field][lang]) errors.push(`endpoint ${e.id}: ${field}.${lang} missing`);
  }
  for (const feature of e.features) {
    if (!featureIds.has(feature)) errors.push(`endpoint ${e.id}: no page features/${feature}.md`);
  }
}

if (errors.length) {
  console.error(`Docs check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Docs check passed: ${pages.en.length} pages × ${langs.length} languages, ${featureIds.size} features, ${endpoints.length} endpoints.`,
);
