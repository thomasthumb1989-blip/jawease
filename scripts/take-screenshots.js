/**
 * Take app store screenshots of JawEase running on web.
 *
 * Prerequisites:
 *   - npx expo start --web   (running on localhost:8081 or 8082)
 *   - npm install puppeteer --save-dev
 *
 * Usage:
 *   node scripts/take-screenshots.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = process.env.APP_URL || 'http://localhost:8082';
const OUT = path.join(__dirname, '..', 'screenshots');
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 3 };

// Ensure output dir exists
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Fake profile data so screens have content
const FAKE_PROFILE = JSON.stringify({
  symptoms: ['jaw_pain', 'jaw_clicking', 'headaches', 'neck_tension'],
  difficulty: 'moderate',
  sessionLength: 8,
  restDuration: 15,
  audioCues: true,
  hapticFeedback: true,
  reminderEnabled: true,
  painReminderEnabled: false,
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
});

// Fake pain logs (30 days of data, trending 8→4)
function fakePainLogs() {
  const logs = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const pain = Math.max(1, Math.min(10, Math.round(8 - (29 - i) * 0.14 + (Math.random() * 2 - 1))));
    logs.push({
      id: `log-${i}`,
      date: d.toISOString(),
      painLevel: pain,
      triggers: i % 3 === 0 ? ['stress'] : [],
      notes: '',
    });
  }
  return JSON.stringify(logs);
}

// Fake exercise sessions (every other day for 2 weeks)
function fakeSessions() {
  const sessions = [];
  for (let i = 14; i >= 0; i--) {
    if (i % 2 === 1) continue;
    const d = new Date(Date.now() - i * 86400000);
    sessions.push({
      id: `session-${i}`,
      date: d.toISOString(),
      exercises: [
        { exerciseId: 'gentle-jaw-stretch', completed: true, duration: 120 },
        { exerciseId: 'chin-tucks', completed: true, duration: 90 },
        { exerciseId: 'lateral-jaw-movement', completed: true, duration: 60 },
      ],
      totalDuration: 270,
      painBefore: 6,
      painAfter: 3,
    });
  }
  return JSON.stringify(sessions);
}

// Fake streak data
const FAKE_STREAK = JSON.stringify({
  currentStreak: 12,
  longestStreak: 18,
  lastActiveDate: new Date().toISOString().split('T')[0],
});

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function dismissErrorToasts(page) {
  await page.evaluate(() => {
    // Expo/RN Web renders error toasts inside a shadow DOM element with id="error-toast"
    const toast = document.getElementById('error-toast');
    if (toast) toast.style.display = 'none';
  });
}

async function screenshot(page, name, waitMs = 2000) {
  await wait(waitMs);
  await dismissErrorToasts(page);
  await wait(200);
  const filePath = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: filePath, type: 'png' });
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // ─── PHASE 1: Paywall (before onboarding_complete is set) ───────
  console.log('\n=== Phase 1: Paywall ===');
  console.log('Seeding localStorage (without onboarding_complete)...');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    (profile, logs, sessions, streak) => {
      // Seed data but do NOT set onboarding_complete
      // This lets us navigate to /onboarding/paywall without redirect
      localStorage.setItem('jawease_user_profile', profile);
      localStorage.setItem('jawease_pain_logs', logs);
      localStorage.setItem('jawease_exercise_sessions', sessions);
      localStorage.setItem('jawease_streak', streak);
    },
    FAKE_PROFILE,
    fakePainLogs(),
    fakeSessions(),
    FAKE_STREAK,
  );

  // Navigate to paywall — since onboarding is NOT complete, /onboarding/* routes work
  console.log('Navigating to paywall...');
  await page.goto(`${BASE}/onboarding/paywall`, { waitUntil: 'networkidle2', timeout: 60000 });
  await screenshot(page, 'paywall', 3000);

  // ─── PHASE 2: All other screens (onboarding complete + premium) ─
  console.log('\n=== Phase 2: Main screens (premium mode) ===');
  console.log('Setting onboarding_complete + subscription override...');
  await page.evaluate(() => {
    localStorage.setItem('jawease_onboarding_complete', 'true');
    // Web-only override: makes isPremium=true, hides PaywallGates
    localStorage.setItem('jawease_subscription_override', 'active');
  });

  // Reload with premium status
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await wait(3000);

  // Hide Expo web error toast (shadow DOM element)
  await dismissErrorToasts(page);

  // Screenshot: Today tab (landing page)
  console.log('Today tab...');
  await screenshot(page, 'today', 2000);

  // Screenshot: Progress tab (direct nav avoids LogBox toast from SPA routing)
  console.log('Progress tab...');
  await page.goto(`${BASE}/progress`, { waitUntil: 'networkidle2', timeout: 30000 });
  await screenshot(page, 'progress', 3000);

  // Screenshot: Exercises tab
  console.log('Exercises tab...');
  await page.goto(`${BASE}/exercises`, { waitUntil: 'networkidle2', timeout: 30000 });
  await screenshot(page, 'exercises', 2000);

  // Screenshot: Pain log
  console.log('Pain log...');
  await page.goto(`${BASE}/pain-log`, { waitUntil: 'networkidle2', timeout: 30000 });
  await screenshot(page, 'pain-orb', 2000);

  // Screenshot: Exercise flow (with timer running)
  console.log('Exercise flow...');
  await page.goto(`${BASE}/exercise-flow/routine`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);

  // Click Begin button — RN Web uses pointer events, not DOM click()
  // Find the element coords and use Puppeteer's mouse.click for proper pointer dispatch
  const beginRect = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const el = walker.currentNode;
      const text = el.textContent || '';
      if (/^begin$/i.test(text.trim())) {
        // Walk up to find the clickable parent (Pressable renders as a div with cursor pointer)
        let target = el;
        for (let p = el; p && p !== document.body; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.cursor === 'pointer') { target = p; break; }
        }
        const r = target.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
    }
    return null;
  });
  if (beginRect) {
    console.log(`  Clicking Begin at (${beginRect.x}, ${beginRect.y})...`);
    await page.mouse.click(beginRect.x, beginRect.y);
    // Wait through 3-2-1 countdown (~3.5s) + settle into exercise
    await wait(6000);
    console.log('  Timer should be running...');
  } else {
    console.log('  ⚠ Begin button not found, capturing pre-exercise view');
  }
  await screenshot(page, 'exercise-flow', 1000);

  await browser.close();
  console.log('\nDone! Screenshots saved to screenshots/');
})();
