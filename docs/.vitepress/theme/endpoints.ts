import { computed } from 'vue';
import { useData } from 'vitepress';
import data from '../../api/endpoints.json';

export type Lang = 'en' | 'pl' | 'hu';
export type Translated = Record<Lang, string>;

export type EndpointGroup = 'auth' | 'rest' | 'rpc' | 'function' | 'storage';

export interface Endpoint {
  id: string;
  group: EndpointGroup;
  method: string;
  path: string;
  /** How the app calls it, e.g. `supabase.auth.signInWithPassword()`. */
  call: string;
  /** Who may call it: user JWT, anon key, a shared secret… */
  auth: Translated;
  summary: Translated;
  notes?: Translated;
  request?: string;
  response?: string;
  /** Files that call or implement the endpoint, relative to the repo root. */
  source: string[];
  /** Feature pages (features/{id}) that use the endpoint. */
  features: string[];
}

export const endpoints = data.endpoints as Endpoint[];

export const groupOrder: EndpointGroup[] = ['function', 'rpc', 'rest', 'auth', 'storage'];

export const findEndpoint = (id: string) => endpoints.find((e) => e.id === id);

/** Current language and the link prefix of its pages. */
export const useLang = () => {
  const { localeIndex } = useData();
  const lang = computed<Lang>(() => (localeIndex.value === 'root' ? 'en' : (localeIndex.value as Lang)));
  const prefix = computed(() => (lang.value === 'en' ? '/' : `/${lang.value}/`));
  return { lang, prefix };
};
