# HabiTora two-account verification

Use this checklist after Supabase Auth, cloud sync, and friendship SQL are in place.

## Goal

Verify the real user-to-user cheer flow with two Supabase Auth users:

1. Account A can copy its friend ID.
2. Account B can request Account A by friend ID.
3. Account A can accept the incoming request.
4. Both accounts can see the accepted friend in the cheer tab.
5. A cheer stamp inserts a `cheers` row and appears as latest encouragement.

## Setup

- Open the app from `http://localhost:3000/`, not `file://`.
- Use two distinct email identities. Gmail plus aliases are acceptable for test users.
- Before switching accounts in the same browser, note the visible "ログイン中" email in Settings.
- Keep local cache unless intentionally testing logout cleanup.

## Account A

1. Log in with the primary test email.
2. Open Settings and confirm the "ログイン中" email.
3. Open Cheer.
4. Copy or select "あなたのなかまID".
5. Keep this ID as Account A friend code.

## Account B

1. Log out.
2. Log in with a second email identity.
3. Open Settings and confirm the second "ログイン中" email.
4. Open Cheer.
5. Paste Account A friend code into "なかまID".
6. Click "申請".
7. Confirm the app shows a request sent or pending state.

## Accept

1. Log out of Account B.
2. Log back in as Account A.
3. Open Cheer.
4. Confirm Account B appears as an incoming request.
5. Click "承認".
6. Confirm Account B appears as an accepted friend.

## Cheer

1. Send a stamp to the accepted friend.
2. Confirm the app shows the sent stamp locally.
3. Log in as the receiving account.
4. Confirm the friend appears and the latest encouragement is visible.

## Expected guardrails

- Self request shows "自分自身には申請できないよ".
- Existing friend shows "すでにつながっているなかまだよ".
- Outgoing duplicate shows "すでに申請中だよ" or the DB duplicate guard message.
- Reverse pending request shows "相手から申請が届いているよ。承認してね".
- Unknown UUID shows "そのなかまIDは見つからないよ。相手のIDをもう一度確認してね".

## Troubleshooting

- If Supabase returns an email rate-limit message, stop resending links and wait before continuing the receiving-account check.
- Expired or already used magic links redirect back with `otp_expired`; request a fresh link after the rate limit clears.
