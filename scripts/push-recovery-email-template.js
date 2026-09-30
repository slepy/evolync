#!/usr/bin/env node
/**
 * Pushes the "Reset Password" (recovery) e-mail template from
 * supabase/email-templates/reset-password.html to the hosted Supabase project.
 *
 * Why: supabase/config.toml's [auth.email.template.recovery] only applies to
 * the local stack (or `supabase config push`, which replaces the whole hosted
 * auth config — don't). Without this, hosted Supabase keeps its default
 * template, which sends a magic link instead of the 6-digit {{ .Token }} code
 * that app/auth/reset-password.tsx expects.
 *
 * Uses a partial PATCH, so no other auth setting is touched.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<personal access token> node scripts/push-recovery-email-template.js
 * Project ref is taken from SUPABASE_PROJECT_REF or EXPO_PUBLIC_SUPABASE_URL (.env).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split('\n')
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')])
  );
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };

  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('Missing SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens).');
    process.exit(1);
  }

  const projectRef =
    env.SUPABASE_PROJECT_REF ||
    (env.EXPO_PUBLIC_SUPABASE_URL || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('Cannot determine project ref: set SUPABASE_PROJECT_REF or EXPO_PUBLIC_SUPABASE_URL.');
    process.exit(1);
  }

  const content = fs.readFileSync(
    path.join(root, 'supabase/email-templates/reset-password.html'),
    'utf8'
  );

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_recovery: 'Resetowanie hasła — Evolync',
      mailer_templates_recovery_content: content,
    }),
  });

  if (!res.ok) {
    console.error(`Failed (${res.status}): ${await res.text()}`);
    process.exit(1);
  }

  console.log(`Recovery e-mail template updated for project ${projectRef}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
