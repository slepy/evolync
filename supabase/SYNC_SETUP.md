# WatermelonDB ↔ Supabase Synchronization Setup

This document describes how the offline-first synchronization system works in Evolync and how to set it up.

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   User      │ ◄─────► │  WatermelonDB │ ◄─────► │   Supabase   │
│  Actions    │         │   (Local)     │         │   (Remote)   │
└─────────────┘         └──────────────┘         └──────────────┘
                              ▲                           ▲
                              │                           │
                         React Hooks              Edge Function
                         (useSync)                 (/sync)
```

### Data Flow

1. **Write Operations**: All data modifications go to WatermelonDB first (offline-first)
2. **Background Sync**: Automatic synchronization happens in the background when:
   - App comes to foreground
   - Device comes online
   - User manually triggers sync
3. **Conflict Resolution**: "Last write wins" based on `updated_at` timestamp

## Files Structure

```
evolync/
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   └── cors.ts                    # CORS headers
│       └── sync/
│           └── index.ts                   # Sync Edge Function
├── src/
│   └── database/
│       ├── sync.ts                        # Sync configuration
│       └── hooks/
│           └── useSync.ts                 # React hook for sync management
└── src/core/components/SyncedPill/
    └── SyncedPill.tsx                     # Sync pill in screen headers (status + tap to sync)
```

## Setup Instructions

### 1. Deploy Supabase Edge Function

First, deploy the sync endpoint to Supabase:

```bash
# Navigate to your project root
cd /path/to/evolync

# Deploy the sync function
npx supabase functions deploy sync

# Verify deployment
npx supabase functions list
```

### 2. Configure Environment Variables

The Edge Function requires these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your anon/public key

These are auto-configured by Supabase, no manual setup needed.

### 3. Test the Sync Endpoint

```bash
# Get your access token from Supabase Auth
# Then test the endpoint:
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "changes": {},
    "lastPulledAt": 0
  }'
```

Expected response:
```json
{
  "changes": {
    "schools": {
      "created": [...],
      "updated": [...],
      "deleted": [...]
    },
    ...
  },
  "timestamp": 1234567890
}
```

### 4. Enable Sync in Your App

The sync system is automatically enabled when you use the `useSync` hook:

```typescript
import { useSync } from '@/database/hooks/useSync'

function MyComponent() {
  const { syncState, performSync } = useSync({
    autoSyncOnline: true,      // Auto-sync when device comes online
    autoSyncOnForeground: true  // Auto-sync when app comes to foreground
  })

  // Manual sync
  const handleManualSync = async () => {
    const result = await performSync(true) // force = true
    if (result.success) {
      console.log('Sync successful!')
    }
  }

  return (
    <div>
      {syncState.isSyncing && <Spinner />}
      <button onClick={handleManualSync}>Sync Now</button>
    </div>
  )
}
```

### 5. Using Sync in Headers

The `Header` and `SyncStatusBar` components automatically integrate sync:

```typescript
import { Header } from '@/modules/core/components/Header'
import { useSync } from '@/database/hooks/useSync'

function MyScreen() {
  const { performSync } = useSync()

  return (
    <Header
      centerContent={<Text>My Screen</Text>}
      onSyncPress={() => performSync(true)}
    />
  )
}
```

The sync button will appear in the user menu (accessed via logo in header).

## How It Works

### Push Changes (Local → Remote)

When you create/update/delete records in WatermelonDB:

```typescript
import { database } from '@/database'
import School from '@/database/models/School'

// Create a school (saved to local DB first)
await database.write(async () => {
  const school = await database.get<School>('schools').create((record) => {
    record.name = 'My School'
    record.organizationId = 'org-123'
  })
})

// Later, during sync, changes are pushed to Supabase
await performSync()
```

### Pull Changes (Remote → Local)

The sync system automatically pulls remote changes and updates local database:

1. Client sends `lastPulledAt` timestamp to server
2. Server queries Supabase for records created/updated since that time
3. Server sends changes back to client
4. Client applies changes to WatermelonDB

### Conflict Resolution

If the same record is modified both locally and remotely:

- **Strategy**: Last Write Wins
- **Basis**: `updated_at` timestamp comparison
- **Handled by**: WatermelonDB sync adapter automatically

## Sync Triggers

### Automatic Triggers

1. **App Foreground**: When user returns to the app
2. **Network Online**: When device regains internet connection
3. **Minimum Interval**: 5 minutes between auto-syncs (configurable)

### Manual Trigger

Users can manually sync via:
- Menu button: "Sync Now" in the user menu
- Code: `performSync(true)` with force flag

## Monitoring Sync Status

### In UI

The `SyncStatusBar` component shows:
- 🟢 **Online**: Connected and synced
- 🔴 **Offline**: No internet connection
- 🔵 **Syncing**: Sync in progress
- **Last Sync Time**: "5m ago", "Just now", etc.

### In Code

```typescript
const { syncState } = useSync()

console.log({
  isSyncing: syncState.isSyncing,
  lastSyncTime: syncState.lastSyncTime,
  lastSyncError: syncState.lastSyncError,
  isOnline: syncState.isOnline
})
```

## Tables Synchronized

Currently synced tables:
- `organizations`
- `schools`
- `school_members`
- `products`
- `orders`
- `order_items`
- `payments`

To add more tables, update the `tablesToSync` array in [supabase/functions/sync/index.ts](supabase/functions/sync/index.ts#L100).

## Troubleshooting

### Sync Not Working

1. **Check Edge Function Deployment**
   ```bash
   npx supabase functions list
   # Should show "sync" function
   ```

2. **Check Network Connection**
   - Verify `syncState.isOnline` is `true`
   - Check device internet connection

3. **Check Authentication**
   - Sync requires valid Supabase session
   - Verify user is logged in

4. **Check Logs**
   ```bash
   # View Edge Function logs
   npx supabase functions logs sync
   ```

### Sync Errors

Common errors and solutions:

- **"No active session"**: User not logged in, trigger auth flow
- **"Sync pull failed"**: Check Edge Function logs for details
- **"Unauthorized"**: Token expired, refresh session

### Force Full Re-sync

To force a complete re-sync (useful after schema changes):

```typescript
// Clear last sync timestamp
await AsyncStorage.removeItem('@evolync:lastSync')

// Trigger sync
await performSync(true)
```

## Performance Considerations

### Sync Frequency

- **Auto-sync**: Max once per 5 minutes
- **Manual sync**: No restrictions
- **Recommendation**: Let auto-sync handle most cases

### Data Volume

The sync system handles incremental changes only:
- Only records modified since `lastPulledAt` are transferred
- Soft deletes (`deleted_at`) minimize data transfer
- Efficient for large datasets

### Network Usage

- Sync only when online (respects data plans)
- Uses HTTPS compression
- Batches multiple table changes in single request

## Security

- All requests require valid Supabase auth token
- Row Level Security (RLS) policies enforced on server
- CORS configured for app domains only
- Soft deletes preserve audit trail

## Future Enhancements

Planned improvements:
- [ ] Selective table sync (sync only needed tables)
- [ ] Sync progress indicators
- [ ] Conflict resolution UI for manual review
- [ ] Sync statistics dashboard
- [ ] Background sync service worker

## References

- [WatermelonDB Sync Documentation](https://watermelondb.dev/docs/Sync/Intro)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Project Architecture](CLAUDE.md)
