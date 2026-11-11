const puppeteer = require('./node_modules/puppeteer-core');
const { spawn, execFileSync } = require('child_process');
const { performance } = require('perf_hooks');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { generateAudio } = require('./generate_final_audio.cjs');

const ffmpegPath = path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:5173/';

const FINAL_VIDEO_PATH = path.join(__dirname, 'RR_Final_Demo_Video.mp4');
const PREVIEW_VIDEO_PATH = path.join(__dirname, 'RR_Demo_Preview.mp4');
const THUMBNAIL_PATH = path.join(__dirname, 'RR_Demo_Thumbnail.png');

const FPS = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function formatTimeMMSS(secFloat) {
  const s = Math.max(0, Math.floor(secFloat));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

async function runFinalDemoRecording() {
  console.log('=========================================================================');
  console.log(' RAJASTHAN ROYALS SCOUTING PLATFORM - FINAL PRODUCT DEMO RECORDING Engine ');
  console.log(' Target: Full HD 1920x1080 @ 30 FPS (90-110s Main + 20-30s Preview)       ');
  console.log('=========================================================================');

  const tmpDir = path.join(os.tmpdir(), 'rr-demo-work-' + Date.now());
  const tmpProfile = path.join(tmpDir, 'edge-profile');
  fs.mkdirSync(tmpProfile, { recursive: true });

  const rawVideoPath = path.join(tmpDir, 'raw_silent_1080p.mp4');
  const fullAudioPath = path.join(tmpDir, 'audio_full.aac');
  const previewSilentPath = path.join(tmpDir, 'preview_silent.mp4');
  const previewAudioPath = path.join(tmpDir, 'audio_preview.aac');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    userDataDir: tmpProfile,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  });

  const page = await browser.newPage();
  const capturedPageErrors = [];
  page.on('pageerror', (err) => {
    capturedPageErrors.push(err.message);
    console.error('\n[BROWSER PAGEERROR]', err.message);
  });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Opening live running site:', APP_URL);
  await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  // Wait for initial AnimatedCounter animations to land cleanly on exact metrics (883, 200,999, etc.)
  await sleep(2200);

  // Capture crisp 1920x1080 Thumbnail with refined UI + subtle championship hero badge
  console.log('Capturing fresh RR_Demo_Thumbnail.png ...');
  await page.evaluate(() => {
    const thumbOverlay = document.createElement('div');
    thumbOverlay.id = 'demo-thumb-badge';
    thumbOverlay.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 32px;
      z-index: 999999;
      background: linear-gradient(135deg, rgba(11,16,32,0.95) 0%, rgba(23,31,53,0.95) 100%);
      border: 1.5px solid rgba(233,0,116,0.65);
      border-left: 6px solid #E90074;
      border-radius: 16px;
      padding: 18px 26px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.75), 0 0 30px rgba(233,0,116,0.25);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 560px;
    `;
    thumbOverlay.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <span style="padding:3px 10px;border-radius:999px;background:rgba(233,0,116,0.2);border:1px solid rgba(233,0,116,0.5);color:#E90074;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">
          RAJASTHAN ROYALS
        </span>
        <span style="padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.16);border:1px solid rgba(245,158,11,0.45);color:#F59E0B;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
          200,999 DELIVERIES ANALYSED
        </span>
      </div>
      <div style="font-size:24px;font-weight:900;color:#F7F7FB;letter-spacing:-0.4px;line-height:1.18;">
        PLAYER SELECTION &amp; SCOUTING INTELLIGENCE
      </div>
      <div style="font-size:13px;font-weight:600;color:#C9C3DF;margin-top:5px;">
        SupeRR Selector 2.0 • H2H Duels • Hidden Gems • Young Talent • AI Auction
      </div>
    `;
    document.body.appendChild(thumbOverlay);
  });
  await sleep(150);
  await page.screenshot({ path: THUMBNAIL_PATH, type: 'png' });
  await page.evaluate(() => document.getElementById('demo-thumb-badge')?.remove());

  // Inject Non-Invasive Broadcast Overlays (Intro/Outro Cards, Sleek Chapter Tag, Unobtrusive Lower-Third, Cursor + Ripple)
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'rr-demo-broadcast-css';
    style.textContent = `
      #demo-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, #FF3B9A 0%, #E90074 75%);
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 0 14px rgba(233, 0, 116, 0.95), 0 0 28px rgba(117, 69, 200, 0.7);
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(-50%, -50%);
        transition: transform 0.08s ease-out, opacity 0.25s ease;
        opacity: 0;
      }
      #demo-cursor.visible { opacity: 1; }
      #demo-cursor.clicking {
        transform: translate(-50%, -50%) scale(0.72);
        background: #F59E0B;
        box-shadow: 0 0 22px rgba(245, 158, 11, 1);
      }

      #demo-ripple {
        position: fixed;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2.5px solid #F59E0B;
        pointer-events: none;
        z-index: 2147483646;
        transform: translate(-50%, -50%) scale(0.3);
        opacity: 0;
      }
      @keyframes rrRippleAnim {
        0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.95; }
        100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
      }
      #demo-ripple.active {
        animation: rrRippleAnim 0.45s ease-out forwards;
      }

      #demo-lower-third {
        position: fixed;
        bottom: 20px;
        left: 310px;
        right: 32px;
        height: 54px;
        background: rgba(11, 16, 32, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(41, 51, 76, 0.95);
        border-left: 5px solid #E90074;
        border-radius: 13px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 22px;
        z-index: 2147483000;
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.65);
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        pointer-events: none;
      }
      #demo-lower-third.visible {
        opacity: 1;
        transform: translateY(0);
      }

      #demo-title-card {
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at 50% 42%, #192440 0%, #0B1020 64%, #060913 100%);
        z-index: 2147483500;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.9s ease-in-out, transform 1.2s ease-out;
        color: #F7F7FB;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
      }
      #demo-title-card.hidden {
        opacity: 0;
        transform: scale(1.03);
        pointer-events: none;
      }
      @keyframes rrSlowZoom {
        0% { transform: scale(0.96); opacity: 0.3; }
        20% { opacity: 1; }
        100% { transform: scale(1.03); opacity: 1; }
      }
      .rr-hero-inner {
        animation: rrSlowZoom 6.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.left = '960px';
    cursor.style.top = '540px';
    document.body.appendChild(cursor);

    const ripple = document.createElement('div');
    ripple.id = 'demo-ripple';
    document.body.appendChild(ripple);

    const lt = document.createElement('div');
    lt.id = 'demo-lower-third';
    lt.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:9px;height:9px;border-radius:50%;background:#E90074;box-shadow:0 0 10px #E90074;"></div>
        <div>
          <div id="demo-lt-badge" style="font-size:10.5px;font-weight:800;color:#E90074;letter-spacing:1.6px;text-transform:uppercase;">
            RAJASTHAN ROYALS INTELLIGENCE
          </div>
          <div id="demo-lt-title" style="font-size:13.5px;font-weight:700;color:#F7F7FB;margin-top:1px;">
            Player Selection &amp; Scouting Intelligence Platform
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="padding:4px 10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);border-radius:8px;font-size:10.5px;font-weight:700;color:#F59E0B;letter-spacing:0.8px;">
          SUPERR SELECTOR 2.0
        </div>
        <div id="demo-timer" style="font-family:monospace;font-size:12.5px;font-weight:800;color:#C9C3DF;min-width:44px;text-align:right;">
          00:08
        </div>
      </div>
    `;
    document.body.appendChild(lt);

    // Scene 1 Intro Card with subtle cricket graphic & requested copy
    const tc = document.createElement('div');
    tc.id = 'demo-title-card';
    tc.innerHTML = `
      <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.14;pointer-events:none;" viewBox="0 0 1920 1080">
        <circle cx="960" cy="540" r="440" fill="none" stroke="#E90074" stroke-width="1.5" stroke-dasharray="10 12" />
        <circle cx="960" cy="540" r="320" fill="none" stroke="#F59E0B" stroke-width="1" stroke-dasharray="6 10" />
        <rect x="855" y="120" width="210" height="840" rx="18" fill="none" stroke="#7545C8" stroke-width="1.5" opacity="0.7" />
        <line x1="875" y1="220" x2="1045" y2="220" stroke="#F7F7FB" stroke-width="1.5" />
        <line x1="875" y1="860" x2="1045" y2="860" stroke="#F7F7FB" stroke-width="1.5" />
      </svg>
      <div class="rr-hero-inner" style="position:relative;z-index:2;text-align:center;max-width:1120px;padding:48px;">
        <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 22px;background:rgba(233,0,116,0.16);border:1.5px solid rgba(233,0,116,0.55);border-radius:9999px;font-size:14px;font-weight:800;color:#FF4DA6;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px;">
          <span>👑</span> RAJASTHAN ROYALS • SUPERR SELECTOR 2.0
        </div>
        <h1 style="font-size:58px;font-weight:900;letter-spacing:-1px;line-height:1.12;margin:0 0 20px 0;color:#F7F7FB;text-transform:uppercase;">
          PLAYER SELECTION &amp;<br/>
          <span style="background:linear-gradient(90deg,#E90074 0%,#A855F7 55%,#F59E0B 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            SCOUTING INTELLIGENCE PLATFORM
          </span>
        </h1>
        <p style="font-size:24px;font-weight:600;color:#F59E0B;letter-spacing:0.6px;margin:0 0 38px 0;">
          "Discover Talent. Decode Performance. Build the Future."
        </p>
        <div style="display:flex;justify-content:center;gap:18px;font-family:monospace;font-size:13.5px;color:#C9C3DF;">
          <span style="padding:10px 18px;background:rgba(18,26,45,0.88);border:1px solid #29334C;border-radius:12px;">
            883 Historical Matches
          </span>
          <span style="padding:10px 18px;background:rgba(18,26,45,0.88);border:1px solid #29334C;border-radius:12px;">
            200,999 Ball-by-Ball Deliveries
          </span>
          <span style="padding:10px 18px;background:rgba(18,26,45,0.88);border:1px solid #29334C;border-radius:12px;">
            6 Integrated Scouting Engines
          </span>
        </div>
      </div>
    `;
    document.body.appendChild(tc);

    window.setDemoCursor = (x, y, clicking = false) => {
      const c = document.getElementById('demo-cursor');
      if (c) {
        c.classList.add('visible');
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
        if (clicking) {
          c.classList.add('clicking');
          const r = document.getElementById('demo-ripple');
          if (r) {
            r.style.left = `${x}px`;
            r.style.top = `${y}px`;
            r.classList.remove('active');
            void r.offsetWidth;
            r.classList.add('active');
          }
        } else {
          c.classList.remove('clicking');
        }
      }
    };

    window.hideCursor = () => {
      document.getElementById('demo-cursor')?.classList.remove('visible');
    };

    window.setDemoTimer = (mmss) => {
      const el = document.getElementById('demo-timer');
      if (el) el.textContent = mmss;
    };

    window.setDemoLowerThird = (badge, title, visible = true) => {
      const ltEl = document.getElementById('demo-lower-third');
      const bEl = document.getElementById('demo-lt-badge');
      const tEl = document.getElementById('demo-lt-title');
      if (ltEl && bEl && tEl) {
        bEl.textContent = badge;
        tEl.textContent = title;
        if (visible) ltEl.classList.add('visible');
        else ltEl.classList.remove('visible');
      }
    };

    window.hideTitleCard = () => {
      document.getElementById('demo-title-card')?.classList.add('hidden');
    };

    window.showOutroTitleCard = () => {
      const tcEl = document.getElementById('demo-title-card');
      if (!tcEl) return;
      tcEl.innerHTML = `
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15;pointer-events:none;" viewBox="0 0 1920 1080">
          <circle cx="960" cy="540" r="460" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="10 12" />
          <circle cx="960" cy="540" r="340" fill="none" stroke="#E90074" stroke-width="1.5" />
        </svg>
        <div class="rr-hero-inner" style="position:relative;z-index:2;text-align:center;max-width:1050px;padding:48px;">
          <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 22px;background:rgba(245,158,11,0.16);border:1.5px solid rgba(245,158,11,0.5);border-radius:9999px;font-size:13px;font-weight:800;color:#F59E0B;letter-spacing:2.6px;text-transform:uppercase;margin-bottom:26px;">
            SUPERR SELECTOR 2.0 • RAJASTHAN ROYALS
          </div>
          <h1 style="font-size:56px;font-weight:900;letter-spacing:-1px;line-height:1.14;margin:0 0 18px 0;color:#F7F7FB;text-transform:uppercase;">
            THE FUTURE OF<br/>
            <span style="background:linear-gradient(90deg,#E90074 0%,#A855F7 55%,#F59E0B 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              CRICKET RECRUITMENT
            </span>
          </h1>
          <p style="font-size:28px;font-weight:800;color:#F59E0B;letter-spacing:4px;margin:0 0 34px 0;text-transform:uppercase;">
            DISCOVER. ANALYSE. SELECT.
          </p>
          <div style="font-size:15px;font-weight:700;color:#C9C3DF;letter-spacing:1.6px;text-transform:uppercase;">
            RAJASTHAN ROYALS • PLAYER SELECTION &amp; SCOUTING INTELLIGENCE PLATFORM
          </div>
        </div>
      `;
      tcEl.classList.remove('hidden');
    };
  });

  // Start FFmpeg silent raw video pipeline
  console.log('Starting FFmpeg 1080p30 capture stream...');
  const ffmpegArgs = [
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', `${FPS}`,
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-y', rawVideoPath,
  ];

  const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);
  ffmpegProc.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('frame=')) {
      process.stdout.write(`\r[Capture] ${s.trim().split('\n').pop()}`);
    }
  });

  const client = await page.target().createCDPSession();
  let latestFrameBuffer = null;
  let captureStartPerf = null;
  let writtenFrames = 0;

  client.on('Page.screencastFrame', async (frame) => {
    latestFrameBuffer = Buffer.from(frame.data, 'base64');
    if (captureStartPerf === null) {
      captureStartPerf = performance.now();
    }
    try {
      await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    } catch (_) {}
  });

  await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });

  // Wait for first captured screencast frame before choreography begins
  while (!latestFrameBuffer) {
    await sleep(25);
  }
  captureStartPerf = performance.now();

  let timerLastSec = -1;
  const pumpInterval = setInterval(() => {
    if (!latestFrameBuffer || !ffmpegProc.stdin.writable) return;
    const elapsedSec = (performance.now() - captureStartPerf) / 1000;
    const targetFrames = Math.floor(elapsedSec * FPS);
    while (writtenFrames < targetFrames) {
      ffmpegProc.stdin.write(latestFrameBuffer);
      writtenFrames++;
    }
    const wholeSec = Math.floor(elapsedSec);
    if (wholeSec !== timerLastSec) {
      timerLastSec = wholeSec;
      page.evaluate((t) => window.setDemoTimer?.(t), formatTimeMMSS(wholeSec)).catch(() => {});
    }
  }, 16);

  const curPos = { x: 960, y: 540 };
  const elapsedNow = () => (performance.now() - captureStartPerf) / 1000;

  async function smoothMoveTo(endX, endY, steps = 16, delayMs = 20) {
    const sx = curPos.x;
    const sy = curPos.y;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = Math.round(sx + (endX - sx) * ease);
      const y = Math.round(sy + (endY - sy) * ease);
      await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, false), x, y);
      await sleep(delayMs);
    }
    curPos.x = endX;
    curPos.y = endY;
  }

  async function getElementCenter(fnStr, arg = null) {
    return page.evaluate(
      (code, a) => {
        const fn = eval(`(${code})`);
        const el = fn(a);
        if (!el) return null;
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        };
      },
      fnStr,
      arg
    );
  }

  async function moveAndClickButton(matchText, scopeSelector = 'button', steps = 16) {
    const finder = `(arg) => {
      const [sel, txt] = arg;
      const els = Array.from(document.querySelectorAll(sel));
      return els.find((el) => {
        const r = el.getBoundingClientRect();
        const label = (el.textContent || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '');
        return r.width > 0 && r.height > 0 && label.includes(txt);
      }) || null;
    }`;
    await getElementCenter(finder, [scopeSelector, matchText]);
    await sleep(220);
    const pos = await getElementCenter(finder, [scopeSelector, matchText]);
    if (!pos) {
      console.warn(`\n[Warn] Element not found for "${matchText}" (${scopeSelector})`);
      return false;
    }
    await smoothMoveTo(pos.x, pos.y, steps, 18);
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, true), pos.x, pos.y);
    await sleep(110);
    await page.mouse.click(pos.x, pos.y);
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, false), pos.x, pos.y);
    await sleep(140);
    return true;
  }

  async function clickSidebarNav(exactLabel) {
    const finder = `(lbl) => {
      const btns = Array.from(document.querySelectorAll('aside button'));
      return btns.find((el) => Array.from(el.querySelectorAll('span')).some((s) => (s.textContent || '').trim() === lbl)) || null;
    }`;
    const pos = await getElementCenter(finder, exactLabel);
    if (!pos) return false;
    await smoothMoveTo(pos.x, pos.y, 16, 18);
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, true), pos.x, pos.y);
    await sleep(110);
    await page.mouse.click(pos.x, pos.y);
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, false), pos.x, pos.y);
    await sleep(320);
    return true;
  }

  async function smoothScrollWindow(deltaY, steps = 14) {
    const perStep = deltaY / steps;
    for (let i = 0; i < steps; i++) {
      await page.evaluate((dy) => window.scrollBy(0, dy), perStep);
      await sleep(32);
    }
  }

  async function holdUntilElapsed(targetSec) {
    const remMs = (targetSec - elapsedNow()) * 1000;
    if (remMs > 40) await sleep(remMs);
  }

  const sceneMarks = [];
  const markStart = (name) => ({ name, start: Math.max(0, elapsedNow()) });
  const markEnd = (obj) => {
    obj.end = elapsedNow();
    sceneMarks.push(obj);
  };

  // =========================================================================
  // SCENE 1 – CINEMATIC INTRODUCTION (0s - 8s)
  // =========================================================================
  console.log('\n[Scene 1] Cinematic Intro (0s - 8s)');
  const s1 = markStart('scene1_intro');
  await holdUntilElapsed(7.2);
  await page.evaluate(() => window.hideTitleCard());
  await holdUntilElapsed(8.1);
  markEnd(s1);

  // =========================================================================
  // SCENE 2 – MAIN DASHBOARD (8s - 18s)
  // =========================================================================
  console.log('[Scene 2] Main Dashboard Overview (8s - 18s)');
  const s2 = markStart('scene2_dashboard');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 02 • EXECUTIVE OVERVIEW',
      '883 Matches • 200,999 Deliveries • Dual-Phase Leverage Engine (P ∈ [0,1])',
      true
    );
  });
  await smoothMoveTo(680, 390, 18, 22);
  await sleep(900);
  await smoothMoveTo(1080, 390, 16, 22);
  await sleep(700);
  await smoothScrollWindow(520, 18);
  await sleep(1600);
  await smoothScrollWindow(480, 16);
  await sleep(1400);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await holdUntilElapsed(18.0);
  markEnd(s2);

  // =========================================================================
  // SCENE 3 – PLAYER EXPLORER (18s - 30s)
  // =========================================================================
  console.log('[Scene 3] Player Explorer & Top 20 Rankings (18s - 30s)');
  const s3 = markStart('scene3_explorer');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 03 • PLAYER EXPLORER',
      'Top 10 Batters & Bowlers • Country Flags, Roles & Granular Filtering',
      true
    );
  });
  await clickSidebarNav('Player Rankings');
  await sleep(1400);
  await moveAndClickButton('Top 10 Bowlers', 'main button', 14);
  await sleep(1300);
  // Open PlayerModal on Sufiyan Muqeem (hide lower-third cleanly while modal is open)
  await page.evaluate(() => window.setDemoLowerThird('', '', false));
  await moveAndClickButton('Sufiyan Muqeem', 'main h3', 14);
  await sleep(2200);
  // Close PlayerModal via visible Close button
  await moveAndClickButton('Close modal', 'div.fixed button', 12);
  await sleep(300);
  // Briefly show Batting Analytics with Search filter
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 03 • BATTING DATABASE SEARCH',
      '72 Qualified Batters • Instant Franchise & Pressure Filtering',
      true
    );
  });
  await clickSidebarNav('Batting Analytics');
  await sleep(700);
  const searchPos = await getElementCenter(`() => document.querySelector('main input[type="text"]')`);
  if (searchPos) {
    await smoothMoveTo(searchPos.x, searchPos.y, 12, 18);
    await page.mouse.click(searchPos.x, searchPos.y);
    await page.keyboard.type('Jaiswal', { delay: 65 });
  }
  await holdUntilElapsed(30.0);
  markEnd(s3);

  // =========================================================================
  // SCENE 4 – HIDDEN GEM DETECTOR (30s - 42s)
  // =========================================================================
  console.log('[Scene 4] Hidden Gem Detector (30s - 42s)');
  const s4 = markStart('scene4_hidden_gems');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 04 • HIDDEN GEM DETECTOR',
      'Underrated Performers Ranked by Clutch Lift & Sample Upside',
      true
    );
  });
  await clickSidebarNav('Hidden Gem Detector');
  await sleep(1700);
  await smoothScrollWindow(260, 14);
  await sleep(1300);
  // Open "Why This Player?" dossier modal on Asif Khan (#1 Sleeper Gem)
  await page.evaluate(() => window.setDemoLowerThird('', '', false));
  await moveAndClickButton('Why This Player?', 'main button', 14);
  await sleep(3000);
  await moveAndClickButton('Done', 'div.fixed button', 12);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await holdUntilElapsed(42.0);
  markEnd(s4);

  // =========================================================================
  // SCENE 5 – YOUNG TALENT RADAR (42s - 54s)
  // =========================================================================
  console.log('[Scene 5] Young Talent Radar (42s - 54s)');
  const s5 = markStart('scene5_young_talent');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 05 • YOUNG TALENT RADAR (AGES 15–24)',
      'Empirical Youth Stats vs AI Projection • Indian Domestic Spotlight',
      true
    );
  });
  await clickSidebarNav('Young Talent Radar');
  await sleep(1400);
  await moveAndClickButton('Indian', 'main button', 14);
  await sleep(900);
  await moveAndClickButton('Uncapped', 'main label', 12);
  await sleep(1100);
  await smoothScrollWindow(320, 12);
  await sleep(700);
  // Open Scouting Dossier on young uncapped prospect
  await page.evaluate(() => window.setDemoLowerThird('', '', false));
  await moveAndClickButton('Scouting Dossier', 'main button', 14);
  await sleep(2900);
  // Close Scouting Dossier modal cleanly
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div.fixed button'));
    const cls = btns.find((b) => (b.textContent || '').includes('Close') || (b.textContent || '').includes('Done') || (b.textContent || '').trim() === '✕');
    if (cls) cls.click();
    else if (btns.length) btns[0].click();
  });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await holdUntilElapsed(54.0);
  markEnd(s5);

  // =========================================================================
  // SCENE 6 – BATTER VS BOWLER INTELLIGENCE (54s - 69s)
  // =========================================================================
  console.log('[Scene 6] Batter vs Bowler Intelligence (54s - 69s)');
  const s6 = markStart('scene6_h2h');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 06 • BATTER VS BOWLER INTELLIGENCE',
      'Yashasvi Jaiswal vs Trent Boult • Exact Ball-by-Ball Head-to-Head Matrix',
      true
    );
  });
  await clickSidebarNav('Batter vs Bowler');
  await sleep(1100);
  // Type Jaiswal & Boult in matchup search inputs and select options
  const inputsInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('main input[type="text"]'));
    return inputs.slice(0, 2).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    });
  });
  if (inputsInfo[0]) {
    await smoothMoveTo(inputsInfo[0].x, inputsInfo[0].y, 12, 18);
    await page.mouse.click(inputsInfo[0].x, inputsInfo[0].y);
    await page.keyboard.type('Jaiswal', { delay: 55 });
  }
  await sleep(220);
  if (inputsInfo[1]) {
    await smoothMoveTo(inputsInfo[1].x, inputsInfo[1].y, 12, 18);
    await page.mouse.click(inputsInfo[1].x, inputsInfo[1].y);
    await page.keyboard.type('Boult', { delay: 55 });
  }
  await sleep(300);
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('main select'));
    if (selects[0]) {
      const opt = Array.from(selects[0].options).find((o) => o.text.includes('Jaiswal'));
      if (opt) { selects[0].value = opt.value; selects[0].dispatchEvent(new Event('change', { bubbles: true })); }
    }
    if (selects[1]) {
      const opt = Array.from(selects[1].options).find((o) => o.text.includes('Boult'));
      if (opt) { selects[1].value = opt.value; selects[1].dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  await sleep(1800);
  await smoothMoveTo(960, 440, 16, 20);
  await sleep(1200);
  await smoothScrollWindow(360, 16);
  await sleep(1800);
  await moveAndClickButton('IPL Only', 'main button', 14);
  await sleep(1400);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await holdUntilElapsed(69.0);
  markEnd(s6);

  // =========================================================================
  // SCENE 7 – AI AUCTION WAR ROOM (69s - 82s)
  // =========================================================================
  console.log('[Scene 7] AI Auction War Room (69s - 82s)');
  const s7 = markStart('scene7_auction');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 07 • AI AUCTION WAR ROOM',
      '₹100.00 Cr Purse • Player Selection, Rival AI Bids & Live Acquisition',
      true
    );
  });
  await clickSidebarNav('AI Auction War Room');
  await sleep(1100);
  // Filter Domestic pool, select player onto auction block, raise bid & simulate rival counter-bid
  await moveAndClickButton('Domestic', 'main button', 12);
  await sleep(450);
  await moveAndClickButton('', 'main h4', 12);
  await sleep(600);
  await moveAndClickButton('+₹50 Lakhs', 'main button', 12);
  await sleep(600);
  await moveAndClickButton('Simulate Rival Bid', 'main button', 12);
  await sleep(1250);
  // Build compliant 18-player core roster, close auto-opened audit modal, then buy 19th Domestic player live
  await moveAndClickButton('Build Dream RR Squad', 'main button', 12);
  await sleep(750);
  await moveAndClickButton('Close Audit', 'div.fixed button', 10);
  await sleep(500);
  await moveAndClickButton('', 'main h4', 12);
  await sleep(500);
  await moveAndClickButton('+₹50 Lakhs', 'main button', 12);
  await sleep(500);
  await moveAndClickButton('Hammer Down (Sold to RR)', 'main button', 12);
  await sleep(1100);
  await holdUntilElapsed(82.0);
  markEnd(s7);

  // =========================================================================
  // SCENE 8 – SQUAD BUILDER (82s - 94s)
  // =========================================================================
  console.log('[Scene 8] Squad Builder & Franchise Audit (82s - 94s)');
  const s8 = markStart('scene8_squad_builder');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 08 • RR DREAM SQUAD BUILDER & AUDIT',
      'Balanced 19-Player Roster • Domestic/Overseas Rules & Batting/Bowling Depth',
      true
    );
  });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(900);
  // Highlight Purse, Overseas Cap, Role Balance KPIs & live RR Squad list
  await smoothMoveTo(1060, 310, 14, 18);
  await sleep(800);
  await smoothMoveTo(1640, 560, 14, 18);
  await sleep(900);
  // Open Squad Audit Modal cleanly showing full 19-player evaluation & depth
  await page.evaluate(() => window.setDemoLowerThird('', '', false));
  await moveAndClickButton('Evaluate Squad', 'main button', 12);
  await sleep(4500);
  await moveAndClickButton('Close Audit', 'div.fixed button', 12);
  await holdUntilElapsed(94.0);
  markEnd(s8);

  // =========================================================================
  // SCENE 9 – FINAL CLOSING (94s - 103s)
  // =========================================================================
  console.log('[Scene 9] Return to Overview & Closing Outro (94s - 103s)');
  const s9 = markStart('scene9_closing');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SCENE 09 • SUPERR SELECTOR 2.0',
      'Data-Driven Decision Intelligence for Rajasthan Royals',
      true
    );
  });
  await clickSidebarNav('Overview');
  await sleep(2200);
  await page.evaluate(() => {
    window.hideCursor();
    window.setDemoLowerThird('', '', false);
    window.showOutroTitleCard();
  });
  await holdUntilElapsed(103.0);
  markEnd(s9);

  // Flush remaining frames cleanly
  clearInterval(pumpInterval);
  const actualDurationSec = writtenFrames / FPS;
  console.log(`\nStopping capture stream: ${writtenFrames} frames (${actualDurationSec.toFixed(2)}s @ ${FPS} FPS).`);

  try { await client.send('Page.stopScreencast'); } catch (_) {}
  ffmpegProc.stdin.end();
  await new Promise((resolve) => ffmpegProc.on('close', resolve));
  await browser.close();

  // Generate exact-length ambient audio & mux Final Demo Video
  console.log(`Generating ${actualDurationSec.toFixed(2)}s ambient soundtrack & mastering RR_Final_Demo_Video.mp4 ...`);
  generateAudio(actualDurationSec, fullAudioPath);

  execFileSync(ffmpegPath, [
    '-i', rawVideoPath,
    '-i', fullAudioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-ac', '2',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-shortest',
    '-y', FINAL_VIDEO_PATH,
  ], { stdio: 'inherit' });

  // Build 25s Broadcast Preview Video with smooth 0.4s xfade cross-dissolves across best scenes
  console.log('Assembling ~25.5s highlight preview RR_Demo_Preview.mp4 ...');
  const clips = [
    { start: 0.5, dur: 3.5 },
    { start: Math.max(8.2, s2.start + 0.5), dur: 4.0 },
    { start: Math.max(18.5, s3.start + 1.0), dur: 4.0 },
    { start: Math.max(43.0, s5.start + 1.0), dur: 4.0 },
    { start: Math.max(57.5, s6.start + 3.5), dur: 4.5 },
    { start: Math.max(83.5, s8.start + 1.5), dur: 4.5 },
    { start: Math.max(actualDurationSec - 3.8, s9.end - 3.8), dur: 3.5 },
  ];

  const fade = 0.4;
  const trimChains = clips.map(
    (c, idx) => `[0:v]trim=start=${c.start.toFixed(2)}:duration=${c.dur.toFixed(2)},setpts=PTS-STARTPTS[v${idx}]`
  );
  const xfadeChains = [];
  let prevLabel = 'v0';
  let cumulative = clips[0].dur;
  for (let i = 1; i < clips.length; i++) {
    const offset = Math.max(0.1, cumulative - fade * i).toFixed(2);
    const outLabel = i === clips.length - 1 ? 'vout' : `vx${i}`;
    xfadeChains.push(`[${prevLabel}][v${i}]xfade=transition=fade:duration=${fade}:offset=${offset}[${outLabel}]`);
    prevLabel = outLabel;
    cumulative += clips[i].dur;
  }
  const previewDurSec = Math.max(20, cumulative - fade * (clips.length - 1));
  const previewFilter = [...trimChains, ...xfadeChains].join('; ');

  execFileSync(ffmpegPath, [
    '-i', rawVideoPath,
    '-filter_complex', previewFilter,
    '-map', '[vout]',
    '-r', `${FPS}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-y', previewSilentPath,
  ], { stdio: 'inherit' });

  generateAudio(previewDurSec, previewAudioPath);
  execFileSync(ffmpegPath, [
    '-i', previewSilentPath,
    '-i', previewAudioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-ac', '2',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-shortest',
    '-y', PREVIEW_VIDEO_PATH,
  ], { stdio: 'inherit' });

  // Clean temp workspace safely
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n=========================================================================');
  console.log(' DEMO SUITE GENERATED SUCCESSFULLY!');
  console.log(' Captured browser pageerrors:', capturedPageErrors.length, capturedPageErrors);
  console.log(' Scene Timing Marks:', JSON.stringify(sceneMarks.map((s) => ({
    name: s.name,
    start: Number(s.start.toFixed(1)),
    end: Number(s.end.toFixed(1)),
  }))));
  console.log(' Outputs:', FINAL_VIDEO_PATH, '|', PREVIEW_VIDEO_PATH, '|', THUMBNAIL_PATH);
  console.log('=========================================================================');
}

runFinalDemoRecording().catch((err) => {
  console.error('Fatal demo recording error:', err);
  process.exit(1);
});
