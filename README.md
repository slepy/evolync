# Evolync

Evolync is a cross-platform mobile application (React Native + Expo) that combines sports school CRM functionality with advanced 3D visualization and notation tools for movement techniques.

The system is designed with a robust **offline-first architecture**, making it critical for instructors and students working in locations with limited internet connectivity (e.g., gyms, dojos, outdoor fields).

## Tech Stack

### Core

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (Managed Workflow)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/)

### Backend & Data Layer (Offline-First)

- **Local Database:** [WatermelonDB](https://github.com/Nozbe/WatermelonDB) (SQLite via JSI)
- **BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Auth (Email + Google), Storage)
- **Synchronization:** WatermelonDB Sync Adapter (Local DB ↔ Supabase)

### 3D Visualization

- **Engine:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (Three.js wrapper)
- **Helpers:** [@react-three/drei](https://github.com/pmndrs/drei)
- **Interaction:** Inverse Kinematics for limb positioning. Supports multi-actor scenes (e.g., sparring partners).

### UI & State

- **UI Framework:** [Tamagui](https://tamagui.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Forms:** React Hook Form + Zod

## Project Structure

The project follows a modular architecture to ensure scalability and maintainability.

``` structure
src/
├── modules/
│   ├── core/           # Shared UI, hooks, utils, theme
│   ├── auth/           # Authentication feature (screens, components, types)
│   ├── database/       # WatermelonDB setup and schema
│   ├── home/           # Main dashboard feature
│   └── settings/       # User settings feature
├── app/                # Expo Router (Navigation only)
```

## Getting Started Locally

Follow these instructions to set up the project on your local machine.

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- iOS Simulator (Mac only) or Android Emulator
- [Expo Go](https://expo.dev/client) app on your physical device (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd evolync
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory (if not already present) and configure your Supabase credentials and other environment variables.

   ```bash
   # Example .env structure
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the application**

   ```bash
   npx expo start
   ```

## Available Scripts

In the project directory, you can run:

- `npm run start` (or `npx expo start`): Runs the app in the development mode.
- `npm run android`: Runs the app in the Android Emulator.
- `npm run ios`: Runs the app in the iOS Simulator (macOS only).
- `npm run web`: Runs the app in a web browser.
- `npm run update:preview` / `npm run update:production`: Publishes the current JS to that build profile's channel (EAS Update).

## Releasing a preview

Preview and production builds check their EAS Update channel on every cold
start. A newer bundle downloads behind the launch screen ("Updating the app…")
and the app restarts on it. Offline, or when the check takes over 3 s or the
download over 20 s, the app opens on what it has and tries again next launch.

- **JS / TS only** (screens, logic, translations, images imported in code):
  `npm run update:preview` (or `update:production` for production builds).
  Users get it on their next launch, no link. Each profile has its own
  channel, so a preview update never reaches production installs. Development
  builds load JS from Metro and never check.
- **Native change**: a new native dependency, plugins / permissions / icons in
  `app.json`, an Expo SDK upgrade. Build again
  (`eas build -p android --profile preview`) and send the install link. The
  `fingerprint` runtime version keeps such bundles away from older builds
  (`fingerprint.config.js` leaves `google-services.json` out, so an update
  published without that file still matches the build).
- Broken update: `eas update:rollback`, or publish a fix.

## Project Scope

Evolync serves users based on dynamic roles defined within an Organization (e.g., Instructor, Student):

### 1. Instructor (Role)

- **Organization Management:** Manage schools and inventory under one Organization.
- **School Management:** Manage multiple schools, students (including shadow users without accounts), and attendance.
- **Financials:** Track payments, manage inventory (stock), and handle orders.
- **Training Plans:** Create personal plans using a hierarchical 3D structure (Techniques → Steps → Sequences).
- **Student Approval:** Approve pending school join requests via invite codes.

### 2. Student (Role)

- **Status Monitoring:** Check payment status and attendance records.
- **Orders:** Order equipment from the school catalog.
- **3D Notes:** Create private technical notes using the 3D mannequin tool.

### Offline-First Architecture

The application reads and writes exclusively to the local WatermelonDB. A background synchronization process handles data consistency with Supabase, ensuring 100% functionality even without an internet connection.

**Authentication:** User sessions are persisted locally (SecureStore). Once logged in, users can access the app offline immediately without re-authenticating.

## Project Status

🚧 **In Development**

This project is currently under active development. Features and database schemas are subject to change.

## License

### Private / Proprietary

This project is private and proprietary. Unauthorized copying, distribution, or use of this source code is strictly prohibited.
