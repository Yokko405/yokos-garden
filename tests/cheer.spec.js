const { test, expect } = require('@playwright/test');

test('cheer tab shares progress and sends stamps', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    const jsonResponse = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    window.__habitoraOtpCount = 0;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return jsonResponse({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/otp')) {
        window.__habitoraOtpCount += 1;
        return jsonResponse({});
      }
      return originalFetch(input, init);
    };
  });

  await page.goto('/');

  await page.getByRole('button', { name: 'エール', exact: true }).click();

  await expect(page.locator('h3:has-text("エール広場")')).toBeVisible();
  await expect(page.locator('.account-panel')).toHaveCount(0);
  await expect(page.locator('.cheer-auth-cta')).toContainText('なかまとつながるにはログイン');
  await expect(page.locator('.my-share-card')).toContainText('今日 0/4');
  await expect(page.locator('.my-share-card')).toContainText('今週 0%');
  await expect(page.locator('.share-panel .status-pill')).toContainText('進捗だけ共有');

  await page.click('button[aria-label="設定"]');
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();
  await expect(page.locator('.account-panel')).toContainText('未ログイン');
  await expect(page.getByRole('button', { name: 'Google準備中' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Apple準備中' })).toBeDisabled();
  await expect(page.locator('.auth-note')).toContainText('今はメールリンクでログイン');
  await expect(page.locator('input[aria-label="マジックリンク用メール"]')).toBeVisible();
  await page.fill('input[aria-label="マジックリンク用メール"]', 'habitora@example.com');
  await page.click('button:has-text("リンクを送る")');
  await expect(page.locator('.auth-message')).toContainText('マジックリンクを送ったよ');
  await expect.poll(() => page.evaluate(() => window.__habitoraOtpCount)).toBe(1);
  await expect(page.locator('input[aria-label="公開ニックネーム"]')).toHaveValue('YOKO');
  await page.fill('input[aria-label="公開ニックネーム"]', 'Habi Yoko');
  await page.click('button:has-text("公開名保存")');
  await page.getByRole('button', { name: 'エール', exact: true }).click();
  await expect(page.locator('.my-share-card')).toContainText('Habi Yoko');

  await page.click('button[aria-label="設定"]');
  await expect(page.locator('.account-panel')).toContainText('ローカル本体');
  await expect(page.locator('.account-panel')).toContainText('ローカルが本体');
  await expect(page.locator('button:has-text("クラウド復元")')).toBeDisabled();
  await page.click('button:has-text("同期キュー作成")');
  await expect(page.locator('.account-panel')).toContainText('送信待ち');
  const cloudOutbox = await page.evaluate(() => JSON.parse(localStorage.getItem('yg_cloudOutbox')));
  expect(cloudOutbox.profile.displayName).toBe('Habi Yoko');
  expect(cloudOutbox.habitState.data.habits).toHaveLength(4);
  expect(cloudOutbox.sync.status).toBe('pending');

  await page.click('button:has-text("保存済みにする")');
  await expect(page.locator('.account-panel')).toContainText('同期済み');
  await expect(page.locator('.account-panel')).toContainText('サーバー正本');
  await expect(page.locator('.account-panel')).toContainText('ローカルはキャッシュ + 未送信キュー');
  const syncMeta = await page.evaluate(() => JSON.parse(localStorage.getItem('yg_syncMeta')));
  expect(syncMeta.sourceOfTruth).toBe('server');
  expect(syncMeta.status).toBe('synced');
  expect(syncMeta.revision).toBe(1);

  await page.click('button:has-text("習慣名も")');
  await page.getByRole('button', { name: 'エール', exact: true }).click();
  await expect(page.locator('.share-panel .status-pill')).toContainText('習慣名も共有');
  await expect(page.locator('.shared-habits')).toContainText('まだ達成なし');

  await page.click('button[aria-label="Mikaにすごいを送る"]');
  await expect(page.locator('.ally-card:has-text("Mika") .cheer-note')).toContainText('送信済み: ✨ すごい ×1');

  await page.click('button[aria-label="設定"]');
  await page.click('button:has-text("非公開")');
  await page.getByRole('button', { name: 'エール', exact: true }).click();
  await expect(page.locator('.share-panel .status-pill')).toContainText('非公開');
  await expect(page.locator('.my-share-card')).toContainText('今日は自分だけで集中');
});

test('oauth provider buttons follow Supabase auth settings', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return Promise.resolve(new Response(JSON.stringify({
          external: { email: true, google: true, apple: true },
          disable_signup: false,
          mailer_autoconfirm: false
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
  });

  await page.goto('/');
  await page.click('button[aria-label="設定"]');

  await expect(page.getByRole('button', { name: 'Googleで続ける' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Appleで続ける' })).toBeEnabled();
  await expect(page.locator('.auth-note')).toContainText('メールリンクも使える');
});

test('oauth provider buttons start Supabase OAuth redirects', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return Promise.resolve(new Response(JSON.stringify({
          external: { email: true, google: true, apple: true },
          disable_signup: false,
          mailer_autoconfirm: false
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
  });

  const capturedAuthorizeUrls = [];
  await page.route('https://jrigfkeimvtudnthsgsj.supabase.co/auth/v1/authorize**', route => {
    capturedAuthorizeUrls.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>OAuth captured</title><p>ok</p>'
    });
  });

  await page.goto('/');
  await page.click('button[aria-label="設定"]');
  await page.getByRole('button', { name: 'Googleで続ける', exact: true }).click();
  await page.waitForURL('**/auth/v1/authorize**');

  const googleUrl = new URL(capturedAuthorizeUrls.at(-1));
  expect(googleUrl.searchParams.get('provider')).toBe('google');
  expect(googleUrl.searchParams.get('redirect_to')).toBe('http://localhost:3000/');
  expect(googleUrl.searchParams.get('prompt')).toBe('select_account');
  expect(googleUrl.searchParams.get('code_challenge')).toBeTruthy();
  expect(googleUrl.searchParams.get('code_challenge_method')).toBe('s256');

  await page.goto('/');
  await page.click('button[aria-label="設定"]');
  await page.getByRole('button', { name: 'Appleで続ける', exact: true }).click();
  await page.waitForURL('**/auth/v1/authorize**');

  const appleUrl = new URL(capturedAuthorizeUrls.at(-1));
  expect(appleUrl.searchParams.get('provider')).toBe('apple');
  expect(appleUrl.searchParams.get('redirect_to')).toBe('http://localhost:3000/');
  expect(appleUrl.searchParams.get('code_challenge')).toBeTruthy();
  expect(appleUrl.searchParams.get('code_challenge_method')).toBe('s256');
});

test('oauth redirect errors are shown as friendly auth messages', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return Promise.resolve(new Response(JSON.stringify({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
  });

  await page.goto('/#error=access_denied&error_code=validation_failed&error_description=Unsupported+provider%3A+provider+is+not+enabled');
  await page.click('button[aria-label="設定"]');

  await expect(page.locator('.auth-message')).toContainText('ログイン失敗: このログイン方法はSupabase側の設定がまだだよ');
  expect(page.url()).not.toContain('error=');
});

test('expired oauth state asks the user to restart the login flow', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return Promise.resolve(new Response(JSON.stringify({
          external: { email: true, google: true, apple: true },
          disable_signup: false,
          mailer_autoconfirm: false
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      }
      return originalFetch(input, init);
    };
  });

  await page.goto('/#error=server_error&error_code=bad_oauth_state&error_description=OAuth+state+has+expired');
  await page.click('button[aria-label="設定"]');

  await expect(page.locator('.auth-message')).toContainText('ログイン失敗: 認証画面の期限が切れたよ');
  await expect(page.locator('.auth-message')).toContainText('5分以内に完了してね');
  expect(page.url()).not.toContain('error=');
});

test('cheer tab loads cloud allies and sends cloud cheers', async ({ page }) => {
  const userId = '00000000-0000-4000-8000-000000000011';
  const friendId = '00000000-0000-4000-8000-000000000012';
  const requesterId = '00000000-0000-4000-8000-000000000013';
  const outgoingId = '00000000-0000-4000-8000-000000000015';
  const missingFriendId = '00000000-0000-4000-8000-000000000016';
  const duplicateRaceId = '00000000-0000-4000-8000-000000000017';
  const newFriendId = '00000000-0000-4000-8000-000000000014';
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'cheer-cloud@example.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-05-06T00:00:00.000Z',
    updated_at: '2026-05-06T00:00:00.000Z'
  };

  await page.addInitScript(({ user, userId, friendId, requesterId, outgoingId, missingFriendId, duplicateRaceId }) => {
    const originalFetch = window.fetch.bind(window);
    const jsonResponse = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    const base64Url = (value) => btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = [
      base64Url({ alg: 'HS256', typ: 'JWT' }),
      base64Url({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        exp: expiresAt
      }),
      'test-signature'
    ].join('.');

    window.__habitoraFriendshipUpdates = [];
    window.__habitoraCheerInserts = [];
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text) => {
          window.__habitoraCopiedFriendId = text;
        }
      },
      configurable: true
    });
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = (init.method || 'GET').toUpperCase();

      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return jsonResponse({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/user')) {
        return jsonResponse(user);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/friendships')) {
        if (method !== 'GET') {
          const body = JSON.parse(init.body);
          if (method === 'POST' && body.receiver_id === missingFriendId) {
            return Promise.resolve(new Response(JSON.stringify({
              code: '23503',
              details: 'Key is not present in table "users".',
              hint: null,
              message: 'insert or update on table "friendships" violates foreign key constraint'
            }), {
              status: 409,
              headers: { 'content-type': 'application/json' }
            }));
          }
          if (method === 'POST' && body.receiver_id === duplicateRaceId) {
            return Promise.resolve(new Response(JSON.stringify({
              code: '23505',
              details: 'Key already exists.',
              hint: null,
              message: 'duplicate key value violates unique constraint "friendships_active_pair_idx"'
            }), {
              status: 409,
              headers: { 'content-type': 'application/json' }
            }));
          }
          window.__habitoraFriendshipUpdates.push({ method, body });
          return jsonResponse([]);
        }
        return jsonResponse([
          {
            id: 'friendship-accepted',
            requester_id: userId,
            receiver_id: friendId,
            status: 'accepted',
            created_at: '2026-05-06T00:10:00.000Z',
            updated_at: '2026-05-06T00:10:00.000Z'
          },
          {
            id: 'friendship-pending',
            requester_id: requesterId,
            receiver_id: userId,
            status: 'pending',
            created_at: '2026-05-06T00:11:00.000Z',
            updated_at: '2026-05-06T00:11:00.000Z'
          },
          {
            id: 'friendship-outgoing',
            requester_id: userId,
            receiver_id: outgoingId,
            status: 'pending',
            created_at: '2026-05-06T00:11:30.000Z',
            updated_at: '2026-05-06T00:11:30.000Z'
          }
        ]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/profiles')) {
        return jsonResponse([
          {
            user_id: friendId,
            display_name: 'Cloud Mika',
            avatar_skin: 'rabbit',
            avatar_icon: '🐰',
            share_visibility: 'progress',
            updated_at: '2026-05-06T00:12:00.000Z'
          },
          {
            user_id: requesterId,
            display_name: 'Cloud Ren',
            avatar_skin: 'penguin',
            avatar_icon: '🐧',
            share_visibility: 'progress',
            updated_at: '2026-05-06T00:13:00.000Z'
          },
          {
            user_id: outgoingId,
            display_name: 'Cloud Tao',
            avatar_skin: 'cat',
            avatar_icon: '🐈‍⬛',
            share_visibility: 'progress',
            updated_at: '2026-05-06T00:13:30.000Z'
          }
        ]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/progress_days')) {
        return jsonResponse([{
          user_id: friendId,
          date_key: 'Wed May 06 2026',
          completed_count: 2,
          total_count: 3,
          week_rate: 77,
          streak: 8,
          completed_habits: ['🐰 ストレッチ'],
          updated_at: '2026-05-06T00:14:00.000Z'
        }]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/cheers')) {
        if (method !== 'GET') {
          window.__habitoraCheerInserts.push(JSON.parse(init.body));
          return jsonResponse([]);
        }
        return jsonResponse([]);
      }

      return originalFetch(input, init);
    };

    localStorage.setItem('sb-jrigfkeimvtudnthsgsj-auth-token', JSON.stringify({
      access_token: accessToken,
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user
    }));
  }, { user, userId, friendId, requesterId, outgoingId, missingFriendId, duplicateRaceId });

  await page.goto('/');
  await page.getByRole('button', { name: 'エール', exact: true }).click();

  await expect(page.locator('.cheer-auth-cta').filter({ hasText: 'あなたのなかまID' })).toContainText(userId);
  await page.click('button[aria-label="設定"]');
  await expect(page.locator('.signed-in-user')).toContainText(user.email);
  await page.getByRole('button', { name: 'エール', exact: true }).click();
  await page.getByRole('button', { name: 'なかまIDをコピー', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__habitoraCopiedFriendId)).toBe(userId);
  await expect(page.getByText('なかまIDをコピーしたよ', { exact: true })).toBeVisible();
  await expect(page.locator('.ally-card:has-text("Cloud Mika")')).toContainText('今日 2/3');
  await expect(page.locator('.ally-card:has-text("Cloud Mika")')).toContainText('連続 8日');
  await expect(page.locator('.friend-request-list').filter({ hasText: 'Cloud Renから申請' })).toContainText('承認');
  await expect(page.locator('.outgoing-request-list')).toContainText('Cloud Taoに申請中');
  await expect(page.locator('.outgoing-request-list')).toContainText('承認待ち');

  await page.fill('input[aria-label="なかまID"]', friendId);
  await page.click('button:has-text("申請")');
  await expect(page.getByText('すでにつながっているなかまだよ', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBe(0);

  await page.fill('input[aria-label="なかまID"]', outgoingId);
  await page.click('button:has-text("申請")');
  await expect(page.getByText('すでに申請中だよ', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBe(0);

  await page.fill('input[aria-label="なかまID"]', requesterId);
  await page.click('button:has-text("申請")');
  await expect(page.getByText('相手から申請が届いているよ。承認してね', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBe(0);

  await page.fill('input[aria-label="なかまID"]', missingFriendId);
  await page.click('button:has-text("申請")');
  await expect(page.getByText('そのなかまIDは見つからないよ。相手のIDをもう一度確認してね', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBe(0);

  await page.fill('input[aria-label="なかまID"]', duplicateRaceId);
  await page.click('button:has-text("申請")');
  await expect(page.getByText('すでに申請済みか、相手から申請が届いているよ', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBe(0);

  await page.fill('input[aria-label="なかまID"]', newFriendId);
  await page.click('button:has-text("申請")');
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBeGreaterThan(0);
  const friendRequest = await page.evaluate(() => window.__habitoraFriendshipUpdates[0]);
  expect(friendRequest.body.requester_id).toBe(userId);
  expect(friendRequest.body.receiver_id).toBe(newFriendId);
  expect(friendRequest.body.status).toBe('pending');

  await page.click('.friend-request-list button:has-text("承認")');
  await expect.poll(() => page.evaluate(() => window.__habitoraFriendshipUpdates.length)).toBeGreaterThan(1);
  const friendshipUpdate = await page.evaluate(() => window.__habitoraFriendshipUpdates[1]);
  expect(friendshipUpdate.body.status).toBe('accepted');

  await page.click('button[aria-label="Cloud Mikaにすごいを送る"]');
  await expect.poll(() => page.evaluate(() => window.__habitoraCheerInserts.length)).toBe(1);
  const cheerInsert = await page.evaluate(() => window.__habitoraCheerInserts[0]);
  expect(cheerInsert.from_user_id).toBe(userId);
  expect(cheerInsert.to_user_id).toBe(friendId);
  expect(cheerInsert.stamp_id).toBe('great');
});

test('cloud migration card confirms before overwriting existing server data', async ({ page }) => {
  const userId = '00000000-0000-4000-8000-000000000099';
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'migration@example.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-05-06T00:00:00.000Z',
    updated_at: '2026-05-06T00:00:00.000Z'
  };

  await page.addInitScript(({ user }) => {
    const originalFetch = window.fetch.bind(window);
    const jsonResponse = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    const base64Url = (value) => btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = [
      base64Url({ alg: 'HS256', typ: 'JWT' }),
      base64Url({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        exp: expiresAt
      }),
      'test-signature'
    ].join('.');

    window.__habitoraUpserts = [];
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = (init.method || 'GET').toUpperCase();

      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return jsonResponse({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/user')) {
        return jsonResponse(user);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/profiles')) {
        if (method !== 'GET') {
          window.__habitoraUpserts.push({ table: 'profiles', body: JSON.parse(init.body) });
          return jsonResponse([]);
        }
        return jsonResponse([{
          display_name: 'Cloud Existing',
          avatar_skin: 'normal',
          avatar_icon: '🐯',
          share_visibility: 'progress',
          updated_at: '2026-05-06T00:10:00.000Z'
        }]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/habit_states')) {
        if (method !== 'GET') {
          window.__habitoraUpserts.push({ table: 'habit_states', body: JSON.parse(init.body) });
          return jsonResponse([]);
        }
        return jsonResponse([{
          data_json: { habits: [] },
          app_version: 1,
          revision: 4,
          updated_at: '2026-05-06T00:20:00.000Z'
        }]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/progress_days')) {
        if (method !== 'GET') {
          window.__habitoraUpserts.push({ table: 'progress_days', body: JSON.parse(init.body) });
          return jsonResponse([]);
        }
        return jsonResponse([]);
      }

      return originalFetch(input, init);
    };

    localStorage.setItem('yokosGarden', JSON.stringify({
      habits: [
        { id: 1, name: '朝の散歩', icon: '🚶', points: 10, frequency: '毎日', completed: true }
      ],
      level: 2,
      exp: 15,
      coins: 25,
      streak: 3,
      totalCompleted: 6,
      unlockedBadges: [],
      ownedItems: [],
      tigerSkin: 'normal'
    }));
    localStorage.setItem('yg_syncMeta', JSON.stringify({
      status: 'local_only',
      sourceOfTruth: 'local',
      cacheMode: 'primary',
      revision: 0,
      pendingSince: null,
      lastQueuedAt: null,
      lastSyncedAt: null,
      errorMessage: null
    }));
    localStorage.setItem('yg_cloudProfile', JSON.stringify({
      displayName: 'Local Migration',
      accountState: 'local',
      migrationState: 'not_ready',
      lastPreparedAt: null,
      lastQueuedAt: null
    }));
    localStorage.setItem('sb-jrigfkeimvtudnthsgsj-auth-token', JSON.stringify({
      access_token: accessToken,
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user
    }));
  }, { user });

  await page.goto('/');
  await page.click('button[aria-label="設定"]');

  await expect(page.locator('.migration-card')).toContainText('この端末のローカルデータをサーバーへ移行');
  await page.click('.migration-card button:has-text("端末データを保存")');
  await expect(page.locator('.overwrite-confirm-card')).toContainText('既存サーバー rev.4');
  await page.click('.overwrite-confirm-card button:has-text("端末データでサーバー上書き")');

  await expect(page.locator('.auth-message')).toContainText('Supabaseに保存したよ');
  await expect(page.locator('.account-panel')).toContainText('同期済み');
  await expect(page.locator('.account-panel')).toContainText('サーバー正本');

  const upserts = await page.evaluate(() => window.__habitoraUpserts);
  const habitState = upserts.find(entry => entry.table === 'habit_states');
  expect(habitState.body.revision).toBe(5);
  expect(habitState.body.data_json.habits[0].name).toBe('朝の散歩');
});

test('synced cloud cache does not become pending on page reload', async ({ page }) => {
  const userId = '00000000-0000-4000-8000-000000000088';
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'synced-cache@example.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-05-06T00:00:00.000Z',
    updated_at: '2026-05-06T00:00:00.000Z'
  };

  await page.addInitScript(({ user }) => {
    const originalFetch = window.fetch.bind(window);
    const jsonResponse = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    const base64Url = (value) => btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = [
      base64Url({ alg: 'HS256', typ: 'JWT' }),
      base64Url({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        exp: expiresAt
      }),
      'test-signature'
    ].join('.');

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return jsonResponse({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/user')) {
        return jsonResponse(user);
      }
      return originalFetch(input, init);
    };

    localStorage.setItem('yokosGarden', JSON.stringify({
      habits: [
        { id: 1, name: '保存済み習慣', icon: '✅', points: 10, frequency: '毎日', completed: false }
      ],
      level: 2,
      exp: 10,
      coins: 15,
      streak: 3,
      totalCompleted: 6,
      unlockedBadges: [],
      ownedItems: [],
      tigerSkin: 'normal'
    }));
    localStorage.setItem('yg_syncMeta', JSON.stringify({
      status: 'synced',
      sourceOfTruth: 'server',
      cacheMode: 'cache_outbox',
      revision: 3,
      pendingSince: null,
      lastQueuedAt: '2026-05-06T00:20:00.000Z',
      lastSyncedAt: '2026-05-06T00:20:00.000Z',
      errorMessage: null
    }));
    localStorage.setItem('yg_cloudProfile', JSON.stringify({
      displayName: 'Synced Yoko',
      accountState: 'cloud_ready',
      migrationState: 'ready',
      lastPreparedAt: '2026-05-06T00:20:00.000Z',
      lastQueuedAt: '2026-05-06T00:20:00.000Z'
    }));
    localStorage.setItem('sb-jrigfkeimvtudnthsgsj-auth-token', JSON.stringify({
      access_token: accessToken,
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user
    }));
  }, { user });

  await page.goto('/');
  await page.click('button[aria-label="設定"]');
  await expect(page.locator('.account-panel')).toContainText('同期済み');
  await page.waitForTimeout(3500);
  await expect(page.locator('.account-panel')).toContainText('同期済み');
  await expect(page.locator('.account-panel')).not.toContainText('送信待ち');

  const syncMeta = await page.evaluate(() => JSON.parse(localStorage.getItem('yg_syncMeta')));
  expect(syncMeta.status).toBe('synced');
});

test('cloud restore pulls server state into the local cache', async ({ page }) => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'cloud-restore@example.com',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-05-05T00:00:00.000Z',
    updated_at: '2026-05-05T00:00:00.000Z'
  };

  await page.addInitScript(({ user }) => {
    const originalFetch = window.fetch.bind(window);
    const jsonResponse = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));
    const base64Url = (value) => btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = [
      base64Url({ alg: 'HS256', typ: 'JWT' }),
      base64Url({
        sub: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        exp: expiresAt
      }),
      'test-signature'
    ].join('.');

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/token')) {
        return jsonResponse({
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/settings')) {
        return jsonResponse({
          external: { email: true, google: false, apple: false },
          disable_signup: false,
          mailer_autoconfirm: false
        });
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/auth/v1/user')) {
        return jsonResponse(user);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/profiles')) {
        return jsonResponse([{
          display_name: 'Cloud Yoko',
          avatar_skin: 'rabbit',
          avatar_icon: '🐰',
          share_visibility: 'habits',
          updated_at: '2026-05-05T00:10:00.000Z'
        }]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/habit_states')) {
        return jsonResponse([{
          data_json: {
            habits: [
              { id: 11, name: '水を飲む', icon: '💧', points: 12, frequency: '毎日', completed: true }
            ],
            level: 3,
            exp: 25,
            coins: 80,
            streak: 5,
            totalCompleted: 9,
            unlockedBadges: [],
            ownedItems: [],
            tigerSkin: 'rabbit'
          },
          app_version: 1,
          revision: 7,
          updated_at: '2026-05-05T00:20:00.000Z'
        }]);
      }
      if (url.includes('jrigfkeimvtudnthsgsj.supabase.co/rest/v1/progress_days')) {
        return jsonResponse([{
          date_key: 'Tue May 05 2026',
          completed_count: 1,
          total_count: 1,
          updated_at: '2026-05-05T00:20:00.000Z'
        }]);
      }

      return originalFetch(input, init);
    };

    localStorage.setItem('yokosGarden', JSON.stringify({
      habits: [
        { id: 1, name: 'ローカルだけの習慣', icon: '🐯', points: 10, frequency: '毎日', completed: false }
      ],
      level: 1,
      exp: 0,
      coins: 0,
      streak: 0,
      totalCompleted: 0,
      unlockedBadges: [],
      ownedItems: [],
      tigerSkin: 'normal'
    }));
    localStorage.setItem('yg_syncMeta', JSON.stringify({
      status: 'local_only',
      sourceOfTruth: 'local',
      cacheMode: 'primary',
      revision: 0,
      pendingSince: null,
      lastQueuedAt: null,
      lastSyncedAt: null,
      errorMessage: null
    }));
    localStorage.setItem('yg_cloudProfile', JSON.stringify({
      displayName: 'Local Yoko',
      accountState: 'local',
      migrationState: 'not_ready',
      lastPreparedAt: null,
      lastQueuedAt: null
    }));
    localStorage.setItem('sb-jrigfkeimvtudnthsgsj-auth-token', JSON.stringify({
      access_token: accessToken,
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: 'bearer',
      user
    }));
  }, { user });

  await page.goto('/');
  await page.click('button[aria-label="設定"]');

  await expect(page.locator('.account-panel')).toContainText('ログイン中');
  await page.click('button:has-text("クラウド復元")');
  await expect(page.locator('.restore-confirm-card')).toContainText('クラウド復元');
  await expect(page.locator('.restore-confirm-card')).toContainText('rev.7');
  await page.click('.restore-confirm-card button:has-text("サーバーで端末を上書き")');
  await expect(page.locator('.account-panel')).toContainText('同期済み');
  await expect(page.locator('.account-panel')).toContainText('サーバー正本');
  await expect(page.locator('input[aria-label="公開ニックネーム"]')).toHaveValue('Cloud Yoko');
  await expect(page.locator('.settings-page .share-panel .status-pill')).toContainText('習慣名も共有');
  await page.getByRole('button', { name: 'エール', exact: true }).click();
  await expect(page.locator('.my-share-card')).toContainText('Cloud Yoko');
  await expect(page.locator('.my-share-card')).toContainText('今日 1/1');

  const restoredData = await page.evaluate(() => JSON.parse(localStorage.getItem('yokosGarden')));
  expect(restoredData.habits[0].name).toBe('水を飲む');
  expect(restoredData.level).toBe(3);
  expect(restoredData.tigerSkin).toBe('rabbit');

  const restoredMeta = await page.evaluate(() => JSON.parse(localStorage.getItem('yg_syncMeta')));
  expect(restoredMeta.sourceOfTruth).toBe('server');
  expect(restoredMeta.status).toBe('synced');
  expect(restoredMeta.revision).toBe(7);
});
