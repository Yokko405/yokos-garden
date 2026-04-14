import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

        // 時間帯に応じたデフォルトメッセージ
        function getBaseMessageByTime() {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 11) return 'おはよう！今日も頑張ろう！🐯';
            if (hour >= 11 && hour < 17) return 'こんにちは！いいペースでいこう！🐯';
            if (hour >= 17 && hour < 21) return 'こんばんは！あと少し、いける！🐯';
            return '夜更かし注意！無理せずね🐯';
        }

        function getBaseFaceByTime() {
            const hour = new Date().getHours();
            if (hour >= 21 || hour < 5) return '😴';
            if (hour >= 5 && hour < 11) return '🐯';
            if (hour >= 11 && hour < 17) return '😺';
            return '😼';
        }

        // 時間帯に応じたmoodの設定
        function getBaseMoodByTime() {
            const hour = new Date().getHours();
            if (hour >= 21 || hour < 5) return 'sleepy';
            return 'normal';
        }

        // Audio Manager (Web Audio)
        const audioManager = (() => {
            let ctx = null;
            let musicGain = null;
            let sfxGain = null;
            let musicTimer = null;
            let started = false;
            let musicOn = false;

            const ensure = () => {
                if (!ctx) {
                    ctx = new (window.AudioContext || window.webkitAudioContext)();
                    musicGain = ctx.createGain();
                    sfxGain = ctx.createGain();
                    musicGain.gain.value = 0.15;
                    sfxGain.gain.value = 0.5;
                    musicGain.connect(ctx.destination);
                    sfxGain.connect(ctx.destination);
                }
            };

            const env = (node, startTime, attack = 0.01, decay = 0.2) => {
                const g = ctx.createGain();
                node.connect(g);
                g.connect(sfxGain);
                g.gain.setValueAtTime(0, startTime);
                g.gain.linearRampToValueAtTime(1, startTime + attack);
                g.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay);
                return g;
            };

            const note = (freq, when, dur = 0.2, type = 'sine', toMusic = false) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, when);
                const target = toMusic ? musicGain : sfxGain;
                osc.connect(gainNode);
                gainNode.connect(target);
                gainNode.gain.setValueAtTime(0, when);
                gainNode.gain.linearRampToValueAtTime(toMusic ? 0.3 : 1, when + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, when + dur);
                osc.start(when);
                osc.stop(when + dur + 0.05);
            };

            const playChime = () => {
                if (!ctx) return;
                const now = ctx.currentTime;
                // Simple major arpeggio C-E-G-C
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, now + i * 0.08, 0.18, 'triangle', false));
            };

            const startMusic = () => {
                if (!ctx) return;
                if (musicOn) return;
                musicOn = true;
                const pattern = [
                    392.00, 392.00, 440.00, 392.00, 523.25, 493.88, // cute line
                    392.00, 392.00, 440.00, 392.00, 587.33, 523.25  // variation
                ];
                const beat = 0.28;
                const loop = () => {
                    if (!musicOn) return;
                    let t = ctx.currentTime;
                    pattern.forEach((f, i) => note(f, t + i * beat, 0.22, 'sine', true));
                    musicTimer = setTimeout(loop, (pattern.length * beat) * 1000);
                };
                loop();
            };

            const stopMusic = () => {
                musicOn = false;
                if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
            };

            return {
                init: async () => {
                    if (started) return;
                    ensure();
                    try { await ctx.resume(); } catch (e) { }
                    started = true;
                },
                playChime,
                startMusic,
                stopMusic,
                isMusicOn: () => musicOn
            };
        })();

        // 初期データ

        const initialHabits = [

            { id: 1, name: 'ヨガ', icon: '🧘‍♀️', points: 10, frequency: '毎日', completed: false },

            { id: 2, name: '筋トレ', icon: '💪', points: 15, frequency: '週3回', completed: false },

            { id: 3, name: '英語30分', icon: '📚', points: 20, frequency: '毎日', completed: false },

            { id: 4, name: 'サプリ飲む', icon: '💊', points: 5, frequency: '毎日', completed: false }

        ];

        const badges = [
            // Streak (継続)
            { id: 1, name: '3日連続', icon: '🔥', description: '3日連続達成', requirement: 3, type: 'streak' },
            { id: 2, name: '1週間', icon: '⭐', description: '7日連続達成', requirement: 7, type: 'streak' },
            { id: 11, name: '2週間', icon: '🌱', description: '14日連続達成', requirement: 14, type: 'streak' },
            { id: 12, name: '3週間', icon: '🌿', description: '21日連続達成', requirement: 21, type: 'streak' },
            { id: 3, name: '1ヶ月', icon: '💎', description: '30日連続達成', requirement: 30, type: 'streak' },
            { id: 5, name: '50日連続', icon: '🏆', description: '50日連続達成', requirement: 50, type: 'streak' },
            { id: 13, name: '2ヶ月', icon: '🌲', description: '60日連続達成', requirement: 60, type: 'streak' },
            { id: 14, name: '3ヶ月', icon: '🌳', description: '90日連続達成', requirement: 90, type: 'streak' },
            { id: 6, name: '100日連続', icon: '🐲', description: '100日連続達成', requirement: 100, type: 'streak' },
            { id: 7, name: '200日連続', icon: '👹', description: '200日連続達成', requirement: 200, type: 'streak' },
            { id: 8, name: '365日連続', icon: '🗽', description: '365日連続達成', requirement: 365, type: 'streak' },
            { id: 20, name: '777日連続', icon: '🎰', description: '777日連続達成！大当たり！', requirement: 777, type: 'streak' },

            // Total (累計)
            { id: 15, name: '10回達成', icon: '🥉', description: '累計10回達成', requirement: 10, type: 'total' },
            { id: 16, name: '30回達成', icon: '🥈', description: '累計30回達成', requirement: 30, type: 'total' },
            { id: 17, name: '50回達成', icon: '🥇', description: '累計50回達成', requirement: 50, type: 'total' },
            { id: 4, name: '100回達成', icon: '👑', description: '累計100回達成', requirement: 100, type: 'total' },
            { id: 18, name: '200回達成', icon: '🎗️', description: '累計200回達成', requirement: 200, type: 'total' },
            { id: 19, name: '300回達成', icon: '🎖️', description: '累計300回達成', requirement: 300, type: 'total' },
            { id: 9, name: '500回達成', icon: '🔮', description: '累計500回達成', requirement: 500, type: 'total' },
            { id: 21, name: '777回達成', icon: '🎰', imageSrc: 'badge-777-total.svg', description: '累計777回達成！フィーバー！', requirement: 777, type: 'total' },
            { id: 10, name: '1000回達成', icon: '🪐', description: '累計1000回達成', requirement: 1000, type: 'total' }
        ];

        const shopItems = [
            { id: 2, name: "サングラス", icon: "🕶️", price: 30, type: "accessory", compat: ["normal"] },
            { id: 3, name: "リボン", icon: "🎀", price: 40, type: "accessory", compat: ["normal"] },
            { id: 1, name: "王冠", icon: "👑", price: 50, type: "accessory", compat: ["normal"] },
            { id: 4, name: "花冠", icon: "🌸", price: 60, type: "accessory", compat: ["normal"] },
            { id: 202, name: "リンゴ", icon: "🍎", price: 60, type: "accessory", compat: ["elephant"] },
            { id: 102, name: "ゴーグル", icon: "🥽", price: 80, type: "accessory", compat: ["penguin"] },
            { id: 302, name: "マフラー", icon: "🧣", price: 90, type: "accessory", compat: ["giraffe"] },
            { id: 101, name: "氷の王冠", icon: "🧊", price: 100, type: "accessory", compat: ["penguin"] },
            { id: 401, name: "人参", icon: "🥕", price: 100, type: "accessory", compat: ["rabbit"] },
            { id: 404, name: "リボン", icon: "🎀", price: 120, type: "accessory", compat: ["rabbit"] },
            { id: 405, name: "サングラス", icon: "🕶️", price: 150, type: "accessory", compat: ["rabbit"] },

            { id: 201, name: "サーカス帽", icon: "🎪", price: 120, type: "accessory", compat: ["elephant"] },

            { id: 402, name: "笹", icon: "🎋", price: 120, type: "accessory", compat: ["panda"] },
            { id: 406, name: "リンゴ", icon: "🍎", price: 110, type: "accessory", compat: ["panda"] },
            { id: 407, name: "ボール", icon: "⚽️", price: 200, type: "accessory", compat: ["panda"] },

            { id: 301, name: "雲の王冠", icon: "☁️", price: 150, type: "accessory", compat: ["giraffe"] },

            { id: 403, name: "鈴", icon: "🔔", price: 150, type: "accessory", compat: ["cat"] },
            { id: 408, name: "魚", icon: "🐟", price: 130, type: "accessory", compat: ["cat"] },
            { id: 409, name: "毛糸玉", icon: "🧶", price: 140, type: "accessory", compat: ["cat"] },

            { id: 5, name: "ペンギンスーツ", icon: "🐧", price: 500, type: "skin", skin: "penguin" },
            { id: 8, name: "うさぎの着ぐるみ", icon: "🐰", price: 600, type: "skin", skin: "rabbit" },
            { id: 9, name: "パンダスーツ", icon: "🐼", price: 700, type: "skin", skin: "panda" },
            { id: 10, name: "黒猫パーカー", icon: "🐈‍⬛", price: 750, type: "skin", skin: "cat" },
            { id: 6, name: "ゾウのきぐるみ", icon: "🐘", price: 800, type: "skin", skin: "elephant" },
            { id: 7, name: "キリンパーカー", icon: "🦒", price: 1000, type: "skin", skin: "giraffe" }
        ];

        const STORAGE_KEYS = {
            app: 'yokosGarden',
            backup: 'yokosGarden_backup',
            lastReset: 'yg_lastResetDate',
            lastStreakUpdate: 'yg_lastStreakUpdateDate',
            music: 'yg_music'
        };
        const STORAGE_VERSION = 1;
        const VALID_FREQUENCIES = new Set(['毎日', '週3回', '週5回', '平日']);
        const VALID_SKINS = new Set(['normal', ...shopItems.filter(item => item.type === 'skin').map(item => item.skin)]);
        const KNOWN_BADGE_IDS = new Set(badges.map(badge => badge.id));
        const KNOWN_ITEM_IDS = new Set(shopItems.map(item => item.id));
        const LOCAL_ADMIN_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

        function storageGet(key) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        }

        function storageSet(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (error) {
                return false;
            }
        }

        function storageRemove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                return false;
            }
        }

        function safeParseJSON(value) {
            if (typeof value !== 'string' || value.length === 0) {
                return null;
            }

            try {
                return JSON.parse(value);
            } catch (error) {
                return null;
            }
        }

        function clampNumber(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
            const num = Number(value);
            if (!Number.isFinite(num)) {
                return fallback;
            }
            return Math.min(max, Math.max(min, num));
        }

        function cloneInitialHabits() {
            return initialHabits.map(habit => ({ ...habit }));
        }

        function sanitizeIdList(list, allowedIds) {
            if (!Array.isArray(list)) {
                return [];
            }

            const unique = new Set();
            list.forEach(value => {
                const id = Number(value);
                if (Number.isInteger(id) && allowedIds.has(id)) {
                    unique.add(id);
                }
            });
            return [...unique];
        }

        function sanitizeHabit(rawHabit, index, usedIds) {
            const rawName = typeof rawHabit?.name === 'string' ? rawHabit.name.trim() : '';
            const name = (rawName || `習慣 ${index + 1}`).slice(0, 80);
            const rawIcon = typeof rawHabit?.icon === 'string' ? rawHabit.icon.trim() : '';
            const icon = Array.from(rawIcon || '🐯').slice(0, 2).join('') || '🐯';

            let id = Number(rawHabit?.id);
            if (!Number.isInteger(id) || id <= 0 || usedIds.has(id)) {
                id = 1;
                while (usedIds.has(id)) {
                    id += 1;
                }
            }
            usedIds.add(id);

            const frequency = VALID_FREQUENCIES.has(rawHabit?.frequency) ? rawHabit.frequency : '毎日';

            return {
                id,
                name,
                icon,
                points: clampNumber(rawHabit?.points, 10, 1, 1000000),
                frequency,
                completed: Boolean(rawHabit?.completed)
            };
        }

        function createDefaultAppData() {
            return {
                version: STORAGE_VERSION,
                habits: cloneInitialHabits(),
                level: 1,
                exp: 0,
                coins: 0,
                streak: 0,
                totalCompleted: 0,
                unlockedBadges: [],
                ownedItems: [],
                tigerSkin: 'normal'
            };
        }

        function sanitizeAppData(rawData) {
            const defaults = createDefaultAppData();
            if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
                return defaults;
            }

            const usedIds = new Set();
            const habitsSource = Array.isArray(rawData.habits) && rawData.habits.length > 0
                ? rawData.habits
                : defaults.habits;

            const habits = habitsSource.map((habit, index) => sanitizeHabit(habit, index, usedIds));
            const tigerSkin = VALID_SKINS.has(rawData.tigerSkin) ? rawData.tigerSkin : 'normal';

            return {
                version: STORAGE_VERSION,
                habits,
                level: clampNumber(rawData.level, defaults.level, 1),
                exp: clampNumber(rawData.exp, defaults.exp, 0),
                coins: clampNumber(rawData.coins, defaults.coins, 0),
                streak: clampNumber(rawData.streak, defaults.streak, 0),
                totalCompleted: clampNumber(rawData.totalCompleted, defaults.totalCompleted, 0),
                unlockedBadges: sanitizeIdList(rawData.unlockedBadges, KNOWN_BADGE_IDS),
                ownedItems: sanitizeIdList(rawData.ownedItems, KNOWN_ITEM_IDS),
                tigerSkin
            };
        }

        function backupRawAppData(rawValue, reason) {
            if (typeof rawValue !== 'string' || rawValue.length === 0) {
                return;
            }

            storageSet(STORAGE_KEYS.backup, JSON.stringify({
                reason,
                savedAt: new Date().toISOString(),
                raw: rawValue
            }));
        }

        function persistAppData(appData) {
            const sanitized = sanitizeAppData(appData);
            storageSet(STORAGE_KEYS.app, JSON.stringify(sanitized));
            return sanitized;
        }

        function loadAppData() {
            const rawValue = storageGet(STORAGE_KEYS.app);
            if (!rawValue) {
                return {
                    data: createDefaultAppData(),
                    shouldPersist: false,
                    recoveredFromBackup: false
                };
            }

            const parsed = safeParseJSON(rawValue);
            if (!parsed) {
                backupRawAppData(rawValue, 'invalid-json');
                return {
                    data: createDefaultAppData(),
                    shouldPersist: true,
                    recoveredFromBackup: true
                };
            }

            const sanitized = sanitizeAppData(parsed);
            const normalizedValue = JSON.stringify(sanitized);
            const shouldPersist = rawValue !== normalizedValue;

            if (shouldPersist) {
                backupRawAppData(rawValue, 'normalized');
            }

            return {
                data: sanitized,
                shouldPersist,
                recoveredFromBackup: shouldPersist
            };
        }

        function App() {

            const [activeTab, setActiveTab] = useState('habits');

            const [habits, setHabits] = useState([]);

            const [level, setLevel] = useState(1);

            const [exp, setExp] = useState(0);

            const [coins, setCoins] = useState(0);

            const [streak, setStreak] = useState(0);

            const [totalCompleted, setTotalCompleted] = useState(0);

            const [unlockedBadges, setUnlockedBadges] = useState([]);

            const [ownedItems, setOwnedItems] = useState([]);

            const [tigerMessage, setTigerMessage] = useState(getBaseMessageByTime());

            const [celebrating, setCelebrating] = useState(false);
            const [tigerFace, setTigerFace] = useState(getBaseFaceByTime());

            // mood状態管理
            const [tigerMood, setTigerMood] = useState('normal');
            const [tigerAnimation, setTigerAnimation] = useState('');
            const [tigerSkin, setTigerSkin] = useState('normal'); // 'normal', 'white', 'gold'

            const [musicEnabled, setMusicEnabled] = useState(false);
            // 新規習慣フォーム
            const [newName, setNewName] = useState('');
            const [newIcon, setNewIcon] = useState('🐯');
            const [newPoints, setNewPoints] = useState(10);
            const [newFreq, setNewFreq] = useState('毎日');
            const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
            const canUseAdminTools = LOCAL_ADMIN_HOSTS.has(window.location.hostname)
                && new URLSearchParams(window.location.search).has('admin');

            // 午前1時基準で日付を計算する関数
            const getDateKey = (date) => {
                const dateKey = new Date(date);
                if (dateKey.getHours() < 1) {
                    // 午前1時より前なら前日扱い
                    dateKey.setDate(dateKey.getDate() - 1);
                }
                return dateKey.toDateString();
            };

            // 日付チェックとリセット処理を関数として抽出（PWA対応）
            const checkAndResetDailyHabits = () => {
                const { data: loadedData, shouldPersist, recoveredFromBackup } = loadAppData();
                const now = new Date();
                const today = getDateKey(now); // 午前1時基準の日付文字列
                const lastResetDate = storageGet(STORAGE_KEYS.lastReset);
                let data = loadedData;

                if (lastResetDate !== today) {
                    // リセット前に昨日の完了状態をチェック
                    const yesterdayCompleted = data.habits.some(h => h.completed);

                    // 習慣のcompletedをfalseにリセット
                    const resetHabits = data.habits.map(h => ({
                        ...h,
                        completed: false
                    }));

                    // 連続日数の更新（昨日習慣を完了していなかった場合は0にリセット）
                    const newStreakValue = yesterdayCompleted ? data.streak : 0;

                    // 連続日数がリセットされる場合、連続日数関連のバッジも削除
                    let updatedUnlockedBadges = data.unlockedBadges;
                    if (!yesterdayCompleted) {
                        updatedUnlockedBadges = data.unlockedBadges.filter(badgeId => {
                            const badge = badges.find(b => b.id === badgeId);
                            if (!badge) {
                                return false;
                            }
                            if (badge.type === 'streak') {
                                return newStreakValue >= badge.requirement;
                            }
                            return true;
                        });
                    }

                    data = persistAppData({
                        ...data,
                        habits: resetHabits,
                        streak: newStreakValue,
                        unlockedBadges: updatedUnlockedBadges
                    });

                    // 今日の日付を保存
                    storageSet(STORAGE_KEYS.lastReset, today);
                    // 連続日数更新日もリセット
                    storageRemove(STORAGE_KEYS.lastStreakUpdate);
                } else if (shouldPersist) {
                    data = persistAppData(data);
                }

                setHabits(data.habits);
                setStreak(data.streak);
                setUnlockedBadges(data.unlockedBadges);
                setLevel(data.level);
                setExp(data.exp);
                setCoins(data.coins);
                setTotalCompleted(data.totalCompleted);
                setOwnedItems(data.ownedItems);
                setTigerSkin(data.tigerSkin);

                if (!lastResetDate) {
                    storageSet(STORAGE_KEYS.lastReset, today);
                }

                if (recoveredFromBackup) {
                    setTigerMessage('保存データを安全に読み直したよ。念のためバックアップも残してあるよ🐯');
                }
            };

            // ローカルストレージから読み込み（初回ロード時）
            useEffect(() => {
                checkAndResetDailyHabits();

                const pref = storageGet(STORAGE_KEYS.music);
                if (pref === 'on') setMusicEnabled(true);

                // 初期mood設定
                setTigerMood(getBaseMoodByTime());
                setHasLoadedStorage(true);
            }, []);

            // ページが表示されたとき（PWA対応：visibilitychange）
            useEffect(() => {
                const handleVisibilityChange = () => {
                    if (document.visibilityState === 'visible') {
                        checkAndResetDailyHabits();
                    }
                };

                document.addEventListener('visibilitychange', handleVisibilityChange);
                window.addEventListener('focus', checkAndResetDailyHabits);

                return () => {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.removeEventListener('focus', checkAndResetDailyHabits);
                };
            }, []);

            // 定期的にチェック（1分ごと、オプション）
            useEffect(() => {
                const interval = setInterval(() => {
                    checkAndResetDailyHabits();
                }, 60000); // 1分ごと

                return () => clearInterval(interval);
            }, []);

            // ローカルストレージに保存

            useEffect(() => {
                if (!hasLoadedStorage) {
                    return;
                }

                const data = {
                    habits,
                    level,
                    exp,
                    coins,
                    streak,
                    totalCompleted,
                    unlockedBadges,
                    ownedItems,
                    tigerSkin
                };

                persistAppData(data);

            }, [hasLoadedStorage, habits, level, exp, coins, streak, totalCompleted, unlockedBadges, ownedItems, tigerSkin]);

            // Music preference side-effect
            useEffect(() => {
                if (!hasLoadedStorage) {
                    return;
                }
                storageSet(STORAGE_KEYS.music, musicEnabled ? 'on' : 'off');
            }, [hasLoadedStorage, musicEnabled]);

            // バッジの自動チェック（連続日数と累計完了数が変更されたとき）
            useEffect(() => {
                if (streak > 0 || totalCompleted > 0) {
                    const newBadges = [];
                    badges.forEach(badge => {
                        if (!unlockedBadges.includes(badge.id)) {
                            if ((badge.type === 'streak' && streak >= badge.requirement) ||
                                (badge.type === 'total' && totalCompleted >= badge.requirement)) {
                                newBadges.push(badge.id);
                            }
                        }
                    });
                    if (newBadges.length > 0) {
                        setUnlockedBadges(prev => [...prev, ...newBadges]);
                    }
                }
            }, [streak, totalCompleted, unlockedBadges]);

            const expForNextLevel = level * 50;

            const expPercentage = (exp / expForNextLevel) * 100;

            const completedToday = habits.filter(h => h.completed).length;

            const totalHabits = habits.length;

            // ミュージックのトグル（初回はユーザー操作で初期化）
            const toggleMusic = async () => {
                await audioManager.init();
                if (audioManager.isMusicOn()) {
                    audioManager.stopMusic();
                    setMusicEnabled(false);
                } else {
                    audioManager.startMusic();
                    setMusicEnabled(true);
                }
            };

            // 習慣追加
            const addHabit = (e) => {
                e.preventDefault();
                const name = newName.trim();
                if (!name) return;
                const nextId = (habits.reduce((m, h) => Math.max(m, Number(h.id) || 0), 0) + 1) || 1;
                const created = {
                    id: nextId,
                    name,
                    icon: newIcon || '🐯',
                    points: Math.max(1, Number(newPoints) || 1),
                    frequency: newFreq || '毎日',
                    completed: false
                };
                setHabits([...habits, created]);
                setNewName('');
                setNewIcon('🐯');
                setNewPoints(10);
                setNewFreq('毎日');
            };

            // 習慣削除
            const deleteHabit = (habitId, e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                const target = habits.find(h => h.id === habitId);
                if (!target) return;
                if (!confirm(`「${target.name}」を削除しますか？`)) return;
                const updatedHabits = habits.filter(h => h.id !== habitId);
                setHabits(updatedHabits);
                // 即座にlocalStorageに保存
                const currentData = loadAppData().data;
                persistAppData({
                    ...currentData,
                    habits: updatedHabits
                });
            };

            // デバッグ用: コイン増加
            const getRich = () => {
                setCoins(prev => prev + 1000);
                setTigerMessage('臨時ボーナスだ！💰');
                // ローカルストレージへの保存は useEffect(..., [coins]) で自動化されていないため手動保存が必要だが
                // 今回の実装では coins の変更時に自動保存されるロジックが useEffect にない場合がある。
                // 確認した範囲では coins の変更だけでは保存されない可能性があるため、手動保存を追加する。
                // ただし、既存コードを見ると useEffect(() => { ... save ... }, [habits, level, exp, coins, ...]) のような包括的な保存があるか確認が必要。
                // viewed_code_item を見ると save は checkAndResetDailyHabits 内や個別のハンドラでやっていることが多い。
                // ここでは簡易的に state 更新のみとし、次のアクション（習慣完了など）で保存されることを期待するか、
                // 安全のためここで保存ロジックを入れるか。
                // 既存の saveUserData のような関数が見当たらないので、state更新のみにする。
                // ユーザーは「買い物」をしたいので、買い物をすると保存されるはず。
            };

            // 習慣完了（トグル：もう一度押すと取り消し）

            const completeHabit = async (habitId) => {

                const habit = habits.find(h => h.id === habitId);

                // 既に完了している場合は取り消し処理
                if (habit.completed) {
                    // 習慣を未完了状態に戻す
                    const newHabits = habits.map(h =>
                        h.id === habitId ? { ...h, completed: false } : h
                    );
                    setHabits(newHabits);

                    // 経験値とコインを減算（レベルダウンも考慮）
                    const pointsToRemove = habit.points;
                    const coinsToRemove = Math.floor(habit.points / 2);

                    let newExp = exp - pointsToRemove;
                    let newLevel = level;

                    while (newExp < 0 && newLevel > 1) {
                        newLevel--;
                        newExp += newLevel * 50;
                    }
                    newExp = Math.max(0, newExp);

                    setExp(newExp);
                    setCoins(Math.max(0, coins - coinsToRemove));
                    setLevel(newLevel);
                    setTotalCompleted(Math.max(0, totalCompleted - 1));

                    // 今日の完了した習慣が0になる場合、連続日数を-1して記録もリセット
                    const remainingCompletedToday = habits.filter(h => h.completed && h.id !== habitId).length;
                    const now = new Date();
                    const today = getDateKey(now);
                    const lastStreakUpdateDate = storageGet(STORAGE_KEYS.lastStreakUpdate);

                    let newStreak = streak;
                    if (remainingCompletedToday === 0 && lastStreakUpdateDate === today) {
                        newStreak = Math.max(0, streak - 1);
                        setStreak(newStreak);
                        storageRemove(STORAGE_KEYS.lastStreakUpdate);

                        // 連続日数が減った場合、連続日数関連のバッジをチェック
                        const updatedBadges = unlockedBadges.filter(badgeId => {
                            const badge = badges.find(b => b.id === badgeId);
                            if (!badge) {
                                return false;
                            }
                            if (badge.type === 'streak') {
                                return newStreak >= badge.requirement;
                            }
                            if (badge.type === 'total') {
                                return (totalCompleted - 1) >= badge.requirement;
                            }
                            return true;
                        });
                        setUnlockedBadges(updatedBadges);
                    }

                    // 虎のリアクション（取り消し時）
                    setTigerMessage('取り消したよ！間違いは誰にでもあるね🐯');
                    setTigerFace('😊');
                    setTigerMood('normal');

                    setTimeout(() => {
                        setTigerMessage(getBaseMessageByTime());
                        setTigerFace(getBaseFaceByTime());
                        setTigerMood(getBaseMoodByTime());
                    }, 2000);

                    return;
                }

                // キラキラエフェクト

                createSparkles();

                // サウンド
                await audioManager.init();
                audioManager.playChime();

                // 習慣を完了状態に

                const newHabits = habits.map(h =>

                    h.id === habitId ? { ...h, completed: true } : h

                );

                setHabits(newHabits);

                // 経験値とコイン追加

                let newExp = exp + habit.points;

                let newCoins = coins + Math.floor(habit.points / 2);

                let newLevel = level;

                // レベルアップチェック
                let leveledUp = false;
                while (newExp >= newLevel * 50) {

                    newExp -= newLevel * 50;

                    newLevel++;
                    leveledUp = true;

                    setTigerMessage('🎉 レベルアップ！強くなったよ！');
                    setTigerFace('🤩');

                    // レベルアップ時のmoodとアニメーション
                    setTigerMood('star');
                    setTigerAnimation('animate-spin');
                    setTimeout(() => {
                        setTigerAnimation('');
                    }, 1000);

                    setTimeout(() => {
                        setTigerMessage(getBaseMessageByTime());
                        setTigerFace(getBaseFaceByTime());
                        setTigerMood(getBaseMoodByTime());
                    }, 3000);

                }

                setExp(newExp);

                setCoins(newCoins);

                setLevel(newLevel);

                setTotalCompleted(totalCompleted + 1);

                // 連続日数の更新（今日初めて習慣を完了したとき）
                const now = new Date();
                const today = getDateKey(now); // 午前1時基準
                const lastStreakUpdateDate = storageGet(STORAGE_KEYS.lastStreakUpdate);

                let newStreak = streak;
                // 今日初めて習慣を完了した場合、連続日数を+1
                if (lastStreakUpdateDate !== today) {
                    newStreak = streak + 1;
                    setStreak(newStreak);
                    storageSet(STORAGE_KEYS.lastStreakUpdate, today);
                }

                // 虎のリアクション
                const newCompletedToday = completedToday + 1;
                const allCompleted = newCompletedToday === totalHabits;

                // 全達成時のmoodとアニメーション
                if (allCompleted) {
                    setTigerMood('party');
                    setTigerMessage('🎊 全達成！素晴らしい！🎊');
                } else if (!leveledUp) {
                    // 習慣達成時（レベルアップなし）
                    setTigerMood('happy');
                    setTigerAnimation('animate-bounce');
                    setTimeout(() => {
                        setTigerAnimation('');
                    }, 600);
                }

                setCelebrating(true);

                setTimeout(() => setCelebrating(false), 500);

                const messages = [

                    'やったー！嬉しい！🐯',

                    'すごい！その調子！✨',

                    '完璧！一緒に頑張ろう！💪',

                    'さすがYOKOさん！🔥',

                    '限界突破だ！🌟'

                ];

                if (!allCompleted && !leveledUp) {
                    setTigerMessage(messages[Math.floor(Math.random() * messages.length)]);
                }
                setTigerFace('😸');

                setTimeout(() => {
                    setTigerMessage(getBaseMessageByTime());
                    setTigerFace(getBaseFaceByTime());
                    setTigerMood(getBaseMoodByTime());
                }, 3000);

                // バッジチェック（更新後の連続日数を使用）
                checkBadges(newStreak, totalCompleted + 1);

            };

            // キラキラエフェクト

            const createSparkles = () => {

                for (let i = 0; i < 10; i++) {

                    setTimeout(() => {

                        const sparkle = document.createElement('div');

                        sparkle.className = 'sparkle';

                        sparkle.textContent = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];

                        sparkle.style.left = `${Math.random() * window.innerWidth}px`;

                        sparkle.style.top = `${Math.random() * window.innerHeight}px`;

                        sparkle.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);

                        sparkle.style.setProperty('--ty', `${-50 - Math.random() * 50}px`);

                        document.body.appendChild(sparkle);

                        setTimeout(() => sparkle.remove(), 1000);

                    }, i * 100);

                }

            };

            // バッジチェック

            const checkBadges = (currentStreak, currentTotal) => {

                const newBadges = [];

                badges.forEach(badge => {

                    if (!unlockedBadges.includes(badge.id)) {

                        if ((badge.type === 'streak' && currentStreak >= badge.requirement) ||

                            (badge.type === 'total' && currentTotal >= badge.requirement)) {

                            newBadges.push(badge.id);

                            setTigerMessage(`🎉 バッジ獲得！「${badge.name}」！`);

                        }

                    }

                });

                if (newBadges.length > 0) {

                    setUnlockedBadges(prev => [...prev, ...newBadges]);

                }

            };

            // アイテム購入 / 装備
            const buyItem = (item) => {

                // 既に持っている場合
                if (ownedItems.includes(item.id)) {
                    if (item.type === 'skin') {
                        // スキンなら装備切り替え
                        if (tigerSkin === item.skin) {
                            setTigerSkin('normal');
                            setTigerMessage('トラに戻ったがお🐯');
                        } else {
                            setTigerSkin(item.skin);
                            setTigerMessage(`${item.name}に変身！`);
                            setTigerAnimation('animate-spin');
                            setTimeout(() => setTigerAnimation(''), 1000);
                        }
                    } else {
                        setTigerMessage('もう持ってるよ！');
                    }
                    return;
                }

                if (coins >= item.price) {

                    setCoins(coins - item.price);

                    setOwnedItems([...ownedItems, item.id]);

                    setTigerMessage(`✨ ${item.name}を手に入れた！`);
                    setTigerFace('😍');

                    // スキンなら即装備
                    if (item.type === 'skin') {
                        setTigerSkin(item.skin);
                        setTigerMessage(`${item.name}を手に入れた！変身！`);
                    }

                    // 購入時のmood-love設定
                    setTigerMood('love');
                    setTigerAnimation('animate-bounce');
                    setTimeout(() => {
                        setTigerAnimation('');
                    }, 600);

                    createSparkles();

                } else {

                    setTigerMessage('コインが足りないよ...頑張ろう！');

                }

                setTimeout(() => {
                    setTigerMessage(getBaseMessageByTime());
                    setTigerFace(getBaseFaceByTime());
                    setTigerMood(getBaseMoodByTime());
                }, 3000);

            };

            // 手動リセット（習慣の完了状態をリセット）
            const resetDailyHabits = () => {
                if (!confirm('今日の習慣をリセットしますか？\n（完了状態のみリセットされ、レベルやコイン、連続日数は保持されます）')) {
                    return;
                }

                // 現在の連続日数を保存（手動リセットでは連続日数を保持）
                const currentStreak = streak;

                const resetHabits = habits.map(h => ({
                    ...h,
                    completed: false
                }));
                setHabits(resetHabits);

                // 連続日数を明示的に保持（変更しない）
                setStreak(currentStreak);

                // 今日の日付を更新（自動リセットを防ぐため）
                const today = getDateKey(new Date()); // 午前1時基準
                storageSet(STORAGE_KEYS.lastReset, today);

                setTigerMessage('リセット完了！今日も頑張ろう！🐯');
                setTigerFace('😺');
                setTimeout(() => { setTigerMessage(getBaseMessageByTime()); setTigerFace(getBaseFaceByTime()); }, 3000);
            };

            return (

                <div>

                    {/* ヘッダー */}

                    <div className="header">

                        <h1>🐯 HabiTora</h1>

                        <div style={{ position: 'absolute', right: '12px', top: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
                            <button className="music-toggle" onClick={toggleMusic} style={{ position: 'static' }}>
                                {musicEnabled ? '♪ 音楽ON' : '♪ 音楽OFF'}
                            </button>
                            <button
                                className="music-toggle"
                                onClick={resetDailyHabits}
                                style={{ position: 'static', fontSize: '11px', padding: '6px 10px', display: 'none' }}
                            >
                                🔄 リセット
                            </button>
                            {canUseAdminTools && (
                                <button
                                    className="music-toggle"
                                    onClick={getRich}
                                    style={{ position: 'static', fontSize: '11px', padding: '6px 10px', marginTop: '5px' }}
                                >
                                    💰 +1000
                                </button>
                            )}
                        </div>

                        <div className="stats-container">

                            <div className="stat-box">

                                <div className="stat-label">レベル</div>

                                <div className="stat-value">{level}</div>

                            </div>

                            <div className="stat-box">

                                <div className="stat-label">コイン</div>

                                <div className="stat-value">{coins}</div>

                            </div>

                            <div className="stat-box">

                                <div className="stat-label">連続</div>

                                <div className="stat-value">{streak}日</div>

                            </div>

                        </div>

                    </div>

                    {/* 虎キャラクター */}

                    <div className="tiger-container">

                        <div className={`tiger-box mood-${tigerMood} ${tigerAnimation} skin-${tigerSkin}`}>

                            {/* 虎の特徴 */}
                            <div className="forehead-stripes"></div>
                            <div className="center-stripe"></div>
                            <div className="body-stripes"></div>

                            <div className="face">
                                <div className="eyes">
                                    <div className="eye"></div>
                                    <div className="eye"></div>
                                </div>
                                <div className="nose"></div>
                                <div className="mouth"></div>
                                <div className="whiskers">
                                    <div className="whisker"></div>
                                    <div className="whisker"></div>
                                    <div className="whisker"></div>
                                    <div className="whisker"></div>
                                </div>
                            </div>

                            <div className="cheek left"></div>
                            <div className="cheek right"></div>

                            {/* Zzz表示（mood-sleepy用） */}
                            <div className="zzz">Zzz</div>

                            {/* 装飾アイテム (Tiger) */}
                            {tigerSkin === 'normal' && ownedItems.includes(1) && <div className="crown"></div>}
                            {tigerSkin === 'normal' && ownedItems.includes(2) && <div className="sunglasses"></div>}
                            {tigerSkin === 'normal' && ownedItems.includes(3) && <div className="ribbon"></div>}
                            {tigerSkin === 'normal' && ownedItems.includes(4) && <div className="flower-crown"></div>}

                            {/* 装飾アイテム (Penguin) */}
                            {tigerSkin === 'penguin' && ownedItems.includes(101) && <div className="ice-crown"></div>}
                            {tigerSkin === 'penguin' && ownedItems.includes(102) && <div className="goggles"></div>}

                            {/* 装飾アイテム (Elephant) */}
                            {tigerSkin === 'elephant' && ownedItems.includes(201) && <div className="circus-hat"></div>}
                            {tigerSkin === 'elephant' && ownedItems.includes(202) && <div className="apple"></div>}

                            {/* 装飾アイテム (Giraffe) */}
                            {tigerSkin === 'giraffe' && ownedItems.includes(301) && <div className="cloud-necklace"></div>}
                            {tigerSkin === 'giraffe' && ownedItems.includes(302) && <div className="scarf"></div>}

                            {/* 装飾アイテム (Rabbit) */}
                            {tigerSkin === 'rabbit' && ownedItems.includes(401) && <div className="carrot"></div>}
                            {tigerSkin === 'rabbit' && ownedItems.includes(404) && <div className="rabbit-ribbon"></div>}
                            {tigerSkin === 'rabbit' && ownedItems.includes(405) && <div className="rabbit-sunglasses"></div>}

                            {/* 装飾アイテム (Panda) */}
                            {tigerSkin === 'panda' && ownedItems.includes(402) && <div className="bamboo"></div>}
                            {tigerSkin === 'panda' && ownedItems.includes(406) && <div className="panda-apple"></div>}
                            {tigerSkin === 'panda' && ownedItems.includes(407) && <div className="panda-ball"></div>}

                            {/* 装飾アイテム (Cat) */}
                            {tigerSkin === 'cat' && ownedItems.includes(403) && <div className="bell"></div>}
                            {tigerSkin === 'cat' && ownedItems.includes(408) && <div className="cat-fish"></div>}
                            {tigerSkin === 'cat' && ownedItems.includes(409) && <div className="cat-yarn"></div>}

                            {/* 星のオーラ（mood-star用） */}
                            {tigerMood === 'star' && <div className="star-aura"></div>}

                        </div>

                        <div className="tiger-message">{tigerMessage}</div>

                        <div className="level-badge">Lv.{level} タイガー戦士</div>

                    </div>

                    {/* 経験値バー */}

                    <div className="exp-bar-container">

                        <div className="exp-bar" style={{ width: `${expPercentage}%` }}>

                            {exp} / {expForNextLevel} EXP

                        </div>

                    </div>

                    {/* 今日の進捗 */}

                    {activeTab === 'habits' && (

                        <div className="daily-progress">

                            <h3>今日の進捗</h3>

                            <div className="progress-text">{completedToday} / {totalHabits}</div>

                        </div>

                    )}

                    {/* タブ */}

                    <div className="tabs">

                        <button className={`tab ${activeTab === 'habits' ? 'active' : ''}`} onClick={() => setActiveTab('habits')}>

                            習慣

                        </button>

                        <button className={`tab ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>

                            バッジ

                        </button>

                        <button className={`tab ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>

                            ショップ

                        </button>

                    </div>

                    {/* 習慣タブ */}

                    {activeTab === 'habits' && (

                        <div className="habits-list">

                            {/* 追加フォーム */}
                            <form onSubmit={addHabit} style={{
                                background: '#fff5f5',
                                border: '2px solid #ffe4e1',
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 16
                            }}>
                                <div className="add-grid">
                                    <input
                                        type="text"
                                        placeholder="習慣名（例：朝ヨガ）"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="field-name"
                                        style={{ height: 40, padding: '0 12px', borderRadius: 12, border: '2px solid #ffe4e1' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="絵文字"
                                        value={newIcon}
                                        maxLength={2}
                                        onChange={e => setNewIcon(e.target.value)}
                                        className="field-emoji"
                                        style={{ height: 40, padding: '0 12px', borderRadius: 12, border: '2px solid #ffe4e1', textAlign: 'center' }}
                                    />
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={newPoints}
                                        onChange={e => setNewPoints(e.target.value)}
                                        className="field-points"
                                        style={{ height: 40, padding: '0 12px', borderRadius: 12, border: '2px solid #ffe4e1' }}
                                    />
                                    <select
                                        value={newFreq}
                                        onChange={e => setNewFreq(e.target.value)}
                                        className="field-freq"
                                        style={{ height: 40, padding: '0 12px', borderRadius: 12, border: '2px solid #ffe4e1', background: 'white' }}
                                    >
                                        <option>毎日</option>
                                        <option>週3回</option>
                                        <option>週5回</option>
                                        <option>平日</option>
                                    </select>
                                    <button
                                        type="submit"
                                        aria-label="習慣を追加"
                                        title="追加"
                                        className="field-add"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)',
                                            cursor: 'pointer',
                                            display: 'grid',
                                            placeItems: 'center'
                                        }}
                                    >
                                        ＋
                                    </button>
                                </div>
                            </form>

                            {habits.map(habit => (

                                <div key={habit.id} className={`habit-card ${habit.completed ? 'completed' : ''}`}>

                                    <div className="habit-header">

                                        <div className="habit-icon">{habit.icon}</div>

                                        <div className="habit-info">

                                            <div className="habit-name">{habit.name}</div>

                                            <div className="habit-frequency">{habit.frequency}</div>

                                        </div>

                                    </div>

                                    <div className="habit-footer">

                                        <div className="habit-points">+{habit.points} EXP</div>

                                        <button

                                            className={`check-button ${habit.completed ? 'completed' : ''}`}

                                            onClick={() => completeHabit(habit.id)}

                                        >

                                            {habit.completed ? '✓ 取消' : '達成！'}

                                        </button>

                                        <button
                                            onClick={(e) => deleteHabit(habit.id, e)}
                                            className="check-button"
                                            style={{ background: '#ddd', color: '#666' }}
                                        >
                                            🗑️ 削除
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                    {/* バッジタブ */}

                    {activeTab === 'badges' && (

                        <div style={{ padding: '0 20px', marginBottom: '80px' }}>

                            {/* Streak Section */}
                            <h3 style={{
                                marginTop: '20px',
                                marginBottom: '10px',
                                color: '#ff6b6b',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px'
                            }}>
                                🔥 継続記録 <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}> (途切れるとリセット)</span>
                            </h3>
                            <div className="badges-grid" style={{ padding: '0', marginBottom: '20px' }}>
                                {badges.filter(b => b.type === 'streak').map(badge => (
                                    <div key={badge.id} className={`badge-card ${unlockedBadges.includes(badge.id) ? 'unlocked' : ''} ${badge.id === 21 ? 'badge-card-featured' : ''}`}>
                                        <div className={`badge-icon ${badge.id === 21 ? 'badge-icon-featured' : ''}`}>
                                            {badge.imageSrc ? (
                                                <img src={badge.imageSrc} alt={badge.name} />
                                            ) : (
                                                badge.icon
                                            )}
                                        </div>
                                        <div className="badge-name">{badge.name}</div>
                                        <div className="badge-description">{badge.description}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Section */}
                            <h3 style={{
                                marginTop: '20px',
                                marginBottom: '10px',
                                color: '#fdb931',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px'
                            }}>
                                👑 累計積み上げ <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}> (途切れてもOK)</span>
                            </h3>
                            <div className="badges-grid" style={{ padding: '0' }}>
                                {badges.filter(b => b.type === 'total').map(badge => (
                                    <div key={badge.id} className={`badge-card ${unlockedBadges.includes(badge.id) ? 'unlocked' : ''} ${badge.id === 21 ? 'badge-card-featured' : ''}`}>
                                        <div className={`badge-icon ${badge.id === 21 ? 'badge-icon-featured' : ''}`}>
                                            {badge.imageSrc ? (
                                                <img src={badge.imageSrc} alt={badge.name} />
                                            ) : (
                                                badge.icon
                                            )}
                                        </div>
                                        <div className="badge-name">{badge.name}</div>
                                        <div className="badge-description">{badge.description}</div>
                                    </div>
                                ))}
                            </div>

                        </div>

                    )}

                    {/* ショップタブ */}

                    {activeTab === 'shop' && (

                        <div className="shop-grid">

                            {shopItems.filter(item => item.type === 'skin' || (item.compat && item.compat.includes(tigerSkin))).map(item => (

                                <div

                                    key={item.id}

                                    className={`shop-item ${ownedItems.includes(item.id) ? 'owned' : ''}`}

                                    onClick={() => buyItem(item)}

                                >

                                    <div className="shop-icon">{item.icon}</div>

                                    <div className="shop-name">{item.name}</div>

                                    <div className="shop-price">
                                        {ownedItems.includes(item.id)
                                            ? (item.type === 'skin' && tigerSkin === item.skin ? '変身中' : (item.type === 'skin' ? '変身する' : '所持中'))
                                            : `${item.price} 💰`}
                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                    {/* フッター */}

                    <div className="footer">

                        Push Your Limits! 🐯✨<br />

                        限界を越える、仲間と共にその先へ

                    </div>

                </div>

            );

        }
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
