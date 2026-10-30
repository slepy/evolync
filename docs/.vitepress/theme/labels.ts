import type { EndpointGroup, Lang } from './endpoints';

interface Labels {
  call: string;
  auth: string;
  request: string;
  response: string;
  notes: string;
  source: string;
  usedIn: string;
  allEndpoints: string;
  close: string;
  search: string;
  noResults: string;
  unknown: (id: string) => string;
  groups: Record<EndpointGroup, string>;
  features: Record<string, string>;
  featureGroups: Record<string, string>;
  searchFeatures: string;
  tabs: { overview: string; flows: string; technical: string; api: string };
  purpose: string;
  who: string;
  role: string;
  outcome: string;
  rules: string;
  messages: string;
  situation: string;
  title: string;
  message: string;
  appScreens: string;
  step: (n: number, total: number) => string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  showDiagram: string;
  hideDiagram: string;
  onServer: string;
  noApi: string;
  boardNote: string;
  homeTitle: string;
  homeText: string;
  openFeature: string;
  endpointsCount: (n: number) => string;
  stepsCount: (n: number) => string;
  keys: string;
}

// Texts of the documentation UI itself (explorer, chip, panel, endpoint list).
export const labels: Record<Lang, Labels> = {
  en: {
    call: 'Called as',
    auth: 'Authorization',
    request: 'Request',
    response: 'Response',
    notes: 'Notes',
    source: 'Source',
    usedIn: 'Used in',
    allEndpoints: 'All endpoints',
    close: 'Close',
    search: 'Search endpoints…',
    noResults: 'No endpoint matches.',
    unknown: (id) => `Unknown endpoint: ${id}`,
    groups: {
      function: 'Edge Functions',
      rpc: 'Database functions (RPC)',
      rest: 'Direct table reads (REST)',
      auth: 'Supabase Auth',
      storage: 'Supabase Storage',
    },
    features: {
      'sign-in': 'Sign in',
      'sign-up': 'Sign up',
      'password-reset': 'Password reset',
      'join-school': 'Join a school',
      students: 'Students',
      payments: 'Payments',
      'attendance': 'Attendance',
      'orders': 'Orders',
      'school': 'School dashboard',
      'organization': 'Organization',
      'events': 'Events',
      'trainings': 'Trainings',
      'calendar': 'Calendar',
      'grading': 'Ranks',
      'inventory': 'Products',
      'student-dashboard': 'Student dashboard',
      'notes': 'Notes',
      'threed': '3D notebook',
      'tags': 'Tags',
      'notifications': 'Notifications',
      'profile': 'Profile and settings',
    },
    featureGroups: { account: 'Account', organization: 'Organization', school: 'School', student: 'Student', notebook: 'Notebook' },
    searchFeatures: 'Search features…',
    tabs: { overview: 'Overview', flows: 'Flows', technical: 'Technical', api: 'API' },
    purpose: 'Purpose',
    who: 'Who uses it',
    role: 'Who',
    outcome: 'What happens',
    rules: 'Rules',
    messages: 'Messages',
    situation: 'Situation',
    title: 'Title',
    message: 'Message',
    appScreens: 'Screens from the app',
    step: (n, total) => `Step ${n} of ${total}`,
    previous: 'Previous',
    next: 'Next',
    play: 'Play',
    pause: 'Pause',
    showDiagram: 'Show the full diagram',
    hideDiagram: 'Hide the diagram',
    onServer: 'Happens on the server',
    noApi: 'No server call in this step.',
    boardNote: 'Screens in the flows are rendered from the design boards.',
    homeTitle: 'Evolync documentation',
    homeText: 'Pick a feature to see what it does, walk through its flows screen by screen and open every endpoint it calls.',
    openFeature: 'Open',
    endpointsCount: (n) => `${n} endpoint${n === 1 ? '' : 's'}`,
    stepsCount: (n) => `${n} step${n === 1 ? '' : 's'}`,
    keys: '← → to move between steps',
  },
  pl: {
    call: 'Wywołanie',
    auth: 'Autoryzacja',
    request: 'Żądanie',
    response: 'Odpowiedź',
    notes: 'Uwagi',
    source: 'Kod',
    usedIn: 'Używane w',
    allEndpoints: 'Wszystkie endpointy',
    close: 'Zamknij',
    search: 'Szukaj endpointu…',
    noResults: 'Brak pasujących endpointów.',
    unknown: (id) => `Nieznany endpoint: ${id}`,
    groups: {
      function: 'Edge Functions',
      rpc: 'Funkcje bazy danych (RPC)',
      rest: 'Bezpośrednie odczyty tabel (REST)',
      auth: 'Supabase Auth',
      storage: 'Supabase Storage',
    },
    features: {
      'sign-in': 'Logowanie',
      'sign-up': 'Rejestracja',
      'password-reset': 'Reset hasła',
      'join-school': 'Dołączenie do szkoły',
      students: 'Uczniowie',
      payments: 'Płatności',
      'attendance': 'Obecności',
      'orders': 'Zamówienia',
      'school': 'Pulpit szkoły',
      'organization': 'Organizacja',
      'events': 'Wydarzenia',
      'trainings': 'Treningi',
      'calendar': 'Kalendarz',
      'grading': 'Stopnie',
      'inventory': 'Produkty',
      'student-dashboard': 'Pulpit ucznia',
      'notes': 'Notatki',
      'threed': 'Notatnik 3D',
      'tags': 'Tagi',
      'notifications': 'Powiadomienia',
      'profile': 'Profil i ustawienia',
    },
    featureGroups: { account: 'Konto', organization: 'Organizacja', school: 'Szkoła', student: 'Uczeń', notebook: 'Notatnik' },
    searchFeatures: 'Szukaj funkcjonalności…',
    tabs: { overview: 'Opis', flows: 'Przepływy', technical: 'Technika', api: 'API' },
    purpose: 'Cel',
    who: 'Kto korzysta',
    role: 'Kto',
    outcome: 'Co się dzieje',
    rules: 'Zasady',
    messages: 'Komunikaty',
    situation: 'Sytuacja',
    title: 'Tytuł',
    message: 'Treść',
    appScreens: 'Ekrany z aplikacji',
    step: (n, total) => `Krok ${n} z ${total}`,
    previous: 'Wstecz',
    next: 'Dalej',
    play: 'Odtwórz',
    pause: 'Pauza',
    showDiagram: 'Pokaż pełny diagram',
    hideDiagram: 'Ukryj diagram',
    onServer: 'Dzieje się na serwerze',
    noApi: 'W tym kroku nie ma wywołania serwera.',
    boardNote: 'Ekrany w przepływach są wyrenderowane z boardów projektowych.',
    homeTitle: 'Dokumentacja Evolync',
    homeText: 'Wybierz funkcjonalność, żeby zobaczyć, co robi, przejść jej przepływy ekran po ekranie i otworzyć każdy endpoint, który wywołuje.',
    openFeature: 'Otwórz',
    endpointsCount: (n) => `${n} ${n === 1 ? 'endpoint' : n < 5 ? 'endpointy' : 'endpointów'}`,
    stepsCount: (n) => `${n} ${n === 1 ? 'krok' : n < 5 ? 'kroki' : 'kroków'}`,
    keys: '← → przełączają kroki',
  },
  hu: {
    call: 'Hívás',
    auth: 'Jogosultság',
    request: 'Kérés',
    response: 'Válasz',
    notes: 'Megjegyzések',
    source: 'Forráskód',
    usedIn: 'Használja',
    allEndpoints: 'Összes végpont',
    close: 'Bezárás',
    search: 'Végpont keresése…',
    noResults: 'Nincs találat.',
    unknown: (id) => `Ismeretlen végpont: ${id}`,
    groups: {
      function: 'Edge Functions',
      rpc: 'Adatbázis-függvények (RPC)',
      rest: 'Közvetlen táblaolvasás (REST)',
      auth: 'Supabase Auth',
      storage: 'Supabase Storage',
    },
    features: {
      'sign-in': 'Bejelentkezés',
      'sign-up': 'Regisztráció',
      'password-reset': 'Jelszó-visszaállítás',
      'join-school': 'Csatlakozás iskolához',
      students: 'Tanulók',
      payments: 'Befizetések',
      'attendance': 'Jelenlét',
      'orders': 'Rendelések',
      'school': 'Iskolai irányítópult',
      'organization': 'Szervezet',
      'events': 'Események',
      'trainings': 'Tervezett edzések',
      'calendar': 'Naptár',
      'grading': 'Fokozatok',
      'inventory': 'Termékek',
      'student-dashboard': 'Tanulói irányítópult',
      'notes': 'Jegyzetek',
      'threed': '3D jegyzetfüzet',
      'tags': 'Címkék',
      'notifications': 'Értesítések',
      'profile': 'Profil és beállítások',
    },
    featureGroups: { account: 'Fiók', organization: 'Szervezet', school: 'Iskola', student: 'Tanuló', notebook: 'Jegyzetfüzet' },
    searchFeatures: 'Funkció keresése…',
    tabs: { overview: 'Leírás', flows: 'Folyamatok', technical: 'Technika', api: 'API' },
    purpose: 'Cél',
    who: 'Kik használják',
    role: 'Ki',
    outcome: 'Mi történik',
    rules: 'Szabályok',
    messages: 'Üzenetek',
    situation: 'Helyzet',
    title: 'Cím',
    message: 'Üzenet',
    appScreens: 'Képernyők az alkalmazásból',
    step: (n, total) => `${n}. lépés / ${total}`,
    previous: 'Vissza',
    next: 'Tovább',
    play: 'Lejátszás',
    pause: 'Szünet',
    showDiagram: 'Teljes diagram',
    hideDiagram: 'Diagram elrejtése',
    onServer: 'A szerveren történik',
    noApi: 'Ebben a lépésben nincs szerverhívás.',
    boardNote: 'A folyamatok képernyői a tervezési boardokból készültek.',
    homeTitle: 'Evolync dokumentáció',
    homeText: 'Válassz egy funkciót: megnézheted, mit csinál, képernyőről képernyőre végigmehetsz a folyamatain, és megnyithatod az összes végpontot, amelyet hív.',
    openFeature: 'Megnyitás',
    endpointsCount: (n) => `${n} végpont`,
    stepsCount: (n) => `${n} lépés`,
    keys: '← → váltja a lépéseket',
  },
};
