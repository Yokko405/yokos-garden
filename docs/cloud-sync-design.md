# HabiTora cloud sync design

HabiTora keeps the current local-first behavior. Cloud sync is added as a backup and sharing layer, not as the only source of truth.

After the first successful server save, the server becomes the source of truth. Local storage remains enabled as a cache and offline outbox.

The current prototype connects to Supabase project `jrigfkeimvtudnthsgsj` with a publishable key only. Never put a secret or service-role key in the client bundle.

The app now supports both cloud save and cloud restore. Restore keeps a local backup before replacing this device's cache.

Auth provider setup is tracked in `docs/auth-provider-setup.md`. Auth must be tested from `http://localhost:3000/` or the published HTTPS URL, not from `file://`, because OAuth and magic link redirects need an allowed HTTP/HTTPS return URL.

After login, if this device still has local-only data, the settings screen shows a migration card. The card lets the user save the current device data to Supabase or restore from Supabase. If Supabase already has a saved `habit_states` row, the app shows an in-app overwrite confirmation instead of a browser-native confirm dialog.

## Local storage keys

- `yokosGarden`: full habit state
- `yg_progressHistory`: recent daily progress summaries
- `yg_shareVisibility`: public sharing mode
- `yg_cheerLog`: locally queued cheer interactions
- `yg_cloudProfile`: public nickname and migration status
- `yg_cloudOutbox`: latest server-ready sync payload
- `yg_syncMeta`: sync status, server revision, and local cache role

## Source of truth

```text
Before login or before first upload:
- sourceOfTruth = local
- localStorage is the primary data store

After first successful server save:
- sourceOfTruth = server
- localStorage is cache + offline outbox
- every edit writes locally first, then queues a server payload
```

## Sync statuses

```text
local_only: no server payload has been prepared
pending: local changes are queued in yg_cloudOutbox
synced: server acknowledged the latest queued payload
conflict: server and local revisions both changed
error: upload failed and local outbox should be retried
```

## Public profile

The public profile must never expose email, provider IDs, or private auth identifiers.

```text
profile
- user_id
- display_name
- avatar_skin
- avatar_icon
- share_visibility
- created_at
- updated_at
```

## Server tables

```text
users
- id
- auth_provider
- created_at

profiles
- user_id
- display_name
- avatar_skin
- avatar_icon
- share_visibility
- created_at
- updated_at

habit_states
- user_id
- data_json
- app_version
- revision
- updated_at

progress_days
- user_id
- date_key
- completed_count
- total_count
- streak
- updated_at

friendships
- id
- requester_id
- receiver_id
- status
- created_at
- updated_at

cheers
- id
- from_user_id
- to_user_id
- stamp_id
- label
- created_at
```

## Migration flow

Important production rule: if the iPhone already has the user's real local data, the iPhone is the source of truth until its data is uploaded. Deploy cloud sync to the same live URL that the iPhone already uses, then run the first upload from that iPhone. Do not restore server data onto the iPhone first.

1. User sets a public nickname.
2. App creates a `yg_cloudOutbox` payload from local data.
3. After real auth is connected, server checks whether `habit_states` exists.
4. If no server state exists, upload the local payload.
5. If server state exists and this device is the correct source of truth, the user chooses `端末データでサーバー上書き`.
6. If server state exists but the user wants to discard this device's local state, the user chooses `サーバーで端末を上書き`.
7. Every habit update continues to write localStorage first, then queues the latest cloud payload.
8. After upload succeeds, mark `yg_syncMeta.sourceOfTruth` as `server` and keep local data as cache.

## iPhone-first production migration

Use this when the real data is already on the iPhone.

1. Deploy the updated web app to the exact same origin currently used by the iPhone, for example `https://yokko405.github.io/yokos-garden/`.
2. On the iPhone, open that same URL or the installed PWA from that same URL.
3. Go to Settings and log in with Apple, Google, or magic link.
4. When the migration card appears, tap `端末データを保存`.
5. If the app says an existing server revision exists, tap `端末データでサーバー上書き`.
6. Confirm the status becomes `同期済み`, `サーバー正本`, and the revision increments.
7. Only after the iPhone upload succeeds should other devices use `サーバーで端末を上書き`.

## Restore flow

1. User logs in with Supabase Auth.
2. App reads `profiles`, `habit_states`, and recent `progress_days` for the current user.
3. If no `habit_states` row exists, do not modify local data.
4. If server data exists, ask before replacing this device's cache.
5. Before replacing, copy the current `yokosGarden` value into `yokosGarden_backup` with reason `before-cloud-restore`.
6. Apply server habit data, progress history, public nickname, and share visibility locally.
7. Mark `yg_syncMeta.status = synced`, `sourceOfTruth = server`, and preserve the server revision.

## Cheer flow

1. A logged-in user sees their Supabase user ID as the first friend code.
2. A user can send a friend request by entering another user's friend code.
3. Before insert, the app checks existing friend rows in both directions and stops duplicate, reverse, or already accepted requests with a friendly message.
4. Incoming requests are shown in the cheer tab and can be accepted in-app.
5. Outgoing pending requests are shown as "承認待ち" so the sender knows what happened.
6. If the DB rejects a request because the target auth user does not exist, the app shows a friendly "ID not found" message and does not create local state.
7. Accepted friends replace demo allies in the cheer list.
8. Sending a stamp to an accepted friend inserts a row into `cheers`.
9. The app reads friend profiles, recent `progress_days`, and recent `cheers` to show gentle progress and latest encouragement.

## Conflict rule

For the first release, use "newer updated_at wins" and keep manual recovery by preserving localStorage. Do not delete local data after upload.

## Logout behavior

On logout, ask the user whether to keep or clear this device's cache. Do not silently delete local data.
