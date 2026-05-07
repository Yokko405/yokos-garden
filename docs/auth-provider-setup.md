# HabiTora auth provider setup

This app uses Supabase Auth from the browser with these entry points:

- Google: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Apple: `supabase.auth.signInWithOAuth({ provider: 'apple' })`
- Magic link: `supabase.auth.signInWithOtp({ email })`

The app sends the current HTTP/HTTPS page as the auth redirect target. Do not test auth from `file://`; use local dev or the published URL.

At startup and when the settings screen regains focus, the app reads Supabase Auth settings from `/auth/v1/settings`. Google and Apple buttons stay disabled while their Supabase providers are off, and become available automatically after the provider is enabled in Supabase.

## App URLs

Current project:

- Supabase project ref: `jrigfkeimvtudnthsgsj`
- Supabase auth callback: `https://jrigfkeimvtudnthsgsj.supabase.co/auth/v1/callback`
- Production web URL: `https://yokko405.github.io/yokos-garden/`
- Local dev URL: `http://localhost:3000/`

## Supabase URL configuration

In Supabase Dashboard, open Authentication -> URL Configuration.

Set:

- Site URL: `https://yokko405.github.io/yokos-garden/`
- Redirect URLs:
  - `https://yokko405.github.io/yokos-garden/`
  - `http://localhost:3000/`
  - `http://localhost:3000/**`

For future iOS native auth, add the deep link URL after the bundle ID is finalized.

## Magic link

Magic link works after URL Configuration is set. If email templates are customized, make sure the confirmation link uses the redirect target, not only the site URL.

Recommended first verification:

1. Run `npm run dev`.
2. Open `http://localhost:3000/`.
3. Settings -> enter email -> `リンクを送る`.
4. Open the email link and confirm the app returns to `http://localhost:3000/` logged in.

## Google provider

In Google Cloud / Google Auth Platform:

- Application type: Web application
- Authorized JavaScript origins:
  - `https://yokko405.github.io`
  - `http://localhost:3000`
- Authorized redirect URIs:
  - `https://jrigfkeimvtudnthsgsj.supabase.co/auth/v1/callback`

Then in Supabase Dashboard, open Authentication -> Providers -> Google:

- Enable Google
- Paste the Google Client ID
- Paste the Google Client Secret

No app code change is needed after enabling the provider; return to the app settings screen or reload the app and it will detect the Supabase setting. Google login asks the user to choose an account so two-account QA is easier.

## Apple provider

For the current web OAuth flow, create/configure these in Apple Developer:

- App ID for the iOS app once the bundle ID is finalized
- Services ID for web login, for example `com.yokko405.habitora.web`
- Website domain: `jrigfkeimvtudnthsgsj.supabase.co`
- Return URL: `https://jrigfkeimvtudnthsgsj.supabase.co/auth/v1/callback`
- Sign in with Apple key, then generate the client secret

Then in Supabase Dashboard, open Authentication -> Providers -> Apple:

- Enable Apple
- Client ID: the Apple Services ID
- Secret: generated Apple client secret

No app code change is needed after enabling the provider; return to the app settings screen or reload the app and it will detect the Supabase setting.

## App verification

`npm test` verifies:

- Disabled Google/Apple buttons while Supabase providers are off
- Enabled Google/Apple buttons while Supabase providers are on
- Google and Apple buttons start the correct `/auth/v1/authorize` OAuth redirect
- OAuth redirect errors are shown as friendly in-app messages

Apple does not reliably give the user's display name through the web OAuth flow after the first authorization, so HabiTora keeps using its own public nickname field.

## References

- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Apple login: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase JavaScript OAuth: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- Supabase JavaScript OTP: https://supabase.com/docs/reference/javascript/auth-signinwithotp
