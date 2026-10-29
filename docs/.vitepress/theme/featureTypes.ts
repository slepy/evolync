// Shape of a feature page's frontmatter (features/{id}.md in every language).

export interface StepApi {
  id: string;
  /** Pin position on the screen, in % of its width / height; no pin without both. */
  x?: number;
  y?: number;
}

export interface FlowStep {
  title: string;
  text: string;
  /** Board rendered to public/screens/boards/{screen}.png; none = a server step. */
  screen?: string;
  api?: StepApi[];
}

export interface Flow {
  id: string;
  title: string;
  steps: FlowStep[];
  /** Full Mermaid diagram of the flow. */
  diagram?: string;
}

export interface FeatureFrontmatter {
  feature: string;
  title: string;
  group: string;
  accent: string;
  icon: string;
  summary: string;
  purpose: string;
  who?: { role: string; outcome: string }[];
  rules?: string[];
  messages?: { situation: string; title?: string; message: string }[];
  screens?: { src: string; caption: string }[];
  flows?: Flow[];
  /** Endpoints of the feature not called in any flow step. */
  api?: string[];
}

/** Every endpoint id a feature uses: flow steps first, then the extra list. */
export const featureEndpointIds = (fm: Pick<FeatureFrontmatter, 'flows' | 'api'>) => {
  const ids = (fm.flows ?? []).flatMap((f) => f.steps.flatMap((s) => (s.api ?? []).map((a) => a.id)));
  return [...new Set([...ids, ...(fm.api ?? [])])];
};
