const puppeteer = require('./node_modules/puppeteer-core');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ffmpegPath = path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const audioPath = path.join(__dirname, 'ambient_bg_music.aac');
const outputVideoPath = path.join(__dirname, 'RR_Scouting_Platform_Demo.mp4');
const thumbnailPath = path.join(__dirname, 'RR_Demo_Thumbnail.png');

const FPS = 30;
const DURATION_SEC = 86; // 86 seconds total duration (within 75-100s requirement)
const TOTAL_FRAMES = FPS * DURATION_SEC; // 2,580 frames
const FRAME_INTERVAL_MS = 1000 / FPS; // 33.33ms

async function runDemoRecording() {
  console.log('================================================================');
  console.log(' STARTING PROFESSIONAL RECORDING: RAJASTHAN ROYALS DEMO VIDEO   ');
  console.log(` Target Duration: ${DURATION_SEC}s @ ${FPS} FPS (${TOTAL_FRAMES} frames) Full HD 1080p `);
  console.log('================================================================');

  const tmpProfile = path.join(os.tmpdir(), 'rr-demo-profile-' + Date.now());

  console.log('Launching browser (Microsoft Edge)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    userDataDir: tmpProfile,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  console.log('Navigating to live application at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. INJECT BROADCAST OVERLAY SYSTEM (Cursor, Lower-Third, Title Cards)
  await page.evaluate(() => {
    // Style container
    const style = document.createElement('style');
    style.id = 'demo-broadcast-styles';
    style.innerHTML = `
      /* Custom Smooth Mouse Cursor */
      #demo-cursor {
        position: fixed;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #E90074;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 12px rgba(233, 0, 116, 0.9), 0 0 20px rgba(117, 69, 200, 0.6);
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%);
        transition: transform 0.08s ease-out, background 0.15s ease;
      }
      #demo-cursor.clicking {
        transform: translate(-50%, -50%) scale(0.75);
        background: #F59E0B;
      }

      /* Broadcast Lower-Third Banner */
      #demo-lower-third {
        position: fixed;
        bottom: 24px;
        left: 32px;
        right: 32px;
        height: 58px;
        background: rgba(11, 16, 32, 0.94);
        backdrop-filter: blur(12px);
        border: 1px solid #29334C;
        border-left: 5px solid #E90074;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 999999;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
        opacity: 0;
        transition: opacity 0.5s ease, transform 0.5s ease;
        transform: translateY(20px);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #demo-lower-third.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Title Overlay Card (Intro & Outro) */
      #demo-title-card {
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at center, #171F35 0%, #0B1020 70%, #060913 100%);
        z-index: 99999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.8s ease-in-out;
        color: #F7F7FB;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #demo-title-card.hidden {
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Cursor element
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.left = '960px';
    cursor.style.top = '540px';
    document.body.appendChild(cursor);

    // Lower-third element
    const lt = document.createElement('div');
    lt.id = 'demo-lower-third';
    lt.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #E90074; box-shadow: 0 0 10px #E90074;"></div>
        <div>
          <div id="demo-lt-badge" style="font-size: 11px; font-weight: 800; color: #E90074; letter-spacing: 1.5px; text-transform: uppercase;">
            EXECUTIVE INTELLIGENCE
          </div>
          <div id="demo-lt-title" style="font-size: 14px; font-weight: 700; color: #F7F7FB; margin-top: 2px;">
            Dual-Phase Pressure Engine & Verified 200,999 Deliveries
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="padding: 4px 10px; background: rgba(117, 69, 200, 0.2); border: 1px solid rgba(117, 69, 200, 0.5); border-radius: 8px; font-size: 11px; font-weight: 700; color: #C9C3DF;">
          RAJASTHAN ROYALS
        </div>
        <div style="font-family: monospace; font-size: 13px; font-weight: 800; color: #F59E0B;" id="demo-timer">
          00:00
        </div>
      </div>
    `;
    document.body.appendChild(lt);

    // Title Card Element
    const tc = document.createElement('div');
    tc.id = 'demo-title-card';
    tc.innerHTML = `
      <div style="text-align: center; max-width: 850px; padding: 40px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; background: rgba(233, 0, 116, 0.15); border: 1px solid rgba(233, 0, 116, 0.4); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #E90074; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">
          RAJASTHAN ROYALS • PERFORMANCE INTELLIGENCE
        </div>
        <h1 style="font-size: 54px; font-weight: 900; letter-spacing: -1.5px; margin: 0 0 16px 0; color: #F7F7FB; text-transform: uppercase;">
          Supe<span style="color: #E90074;">RR</span> Selector <span style="font-size: 28px; padding: 4px 12px; background: rgba(117, 69, 200, 0.35); border: 1px solid rgba(117, 69, 200, 0.6); border-radius: 10px; color: #C9C3DF; vertical-align: middle;">2.0</span>
        </h1>
        <p style="font-size: 20px; font-weight: 500; color: #C9C3DF; line-height: 1.5; margin: 0 0 32px 0;">
          Player Selection & Advanced Scouting Intelligence Platform
        </p>
        <div style="display: flex; justify-content: center; gap: 16px; font-family: monospace; font-size: 13px; color: #929BB2;">
          <span style="padding: 8px 16px; background: rgba(18, 26, 45, 0.8); border: 1px solid #29334C; border-radius: 10px;">
            🏏 200,999 Deliveries Analysed
          </span>
          <span style="padding: 8px 16px; background: rgba(18, 26, 45, 0.8); border: 1px solid #29334C; border-radius: 10px;">
            ⚡ Dual-Phase Pressure P ∈ [0,1]
          </span>
          <span style="padding: 8px 16px; background: rgba(18, 26, 45, 0.8); border: 1px solid #29334C; border-radius: 10px;">
            👑 IPL & T20I Big Data
          </span>
        </div>
      </div>
    `;
    document.body.appendChild(tc);

    // Global helper functions in browser context
    window.setDemoCursor = (x, y, clicking = false) => {
      const c = document.getElementById('demo-cursor');
      if (c) {
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
        if (clicking) c.classList.add('clicking');
        else c.classList.remove('clicking');
      }
    };

    window.setDemoLowerThird = (badge, title, visible = true) => {
      const lt = document.getElementById('demo-lower-third');
      const b = document.getElementById('demo-lt-badge');
      const t = document.getElementById('demo-lt-title');
      if (lt && b && t) {
        b.innerText = badge;
        t.innerText = title;
        if (visible) lt.classList.add('visible');
        else lt.classList.remove('visible');
      }
    };

    window.hideTitleCard = () => {
      const tc = document.getElementById('demo-title-card');
      if (tc) tc.classList.add('hidden');
    };

    window.showOutroTitleCard = () => {
      const tc = document.getElementById('demo-title-card');
      if (tc) {
        tc.innerHTML = `
          <div style="text-align: center; max-width: 850px; padding: 40px; animation: fadeIn 0.8s ease;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 9999px; font-size: 12px; font-weight: 800; color: #F59E0B; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">
              DATA-DRIVEN CHAMPIONS
            </div>
            <h1 style="font-size: 52px; font-weight: 900; letter-spacing: -1.5px; margin: 0 0 16px 0; color: #F7F7FB; text-transform: uppercase;">
              Supe<span style="color: #E90074;">RR</span> Selector <span style="color: #F59E0B;">2.0</span>
            </h1>
            <p style="font-size: 21px; font-weight: 600; color: #C9C3DF; line-height: 1.6; margin: 0 0 28px 0;">
              "Performance is measured by what happens when the game is on the line."
            </p>
            <div style="font-size: 14px; color: #929BB2; letter-spacing: 1px; font-weight: 600;">
              RAJASTHAN ROYALS PLAYER SELECTION & SCOUTING INTELLIGENCE PLATFORM
            </div>
          </div>
        `;
        tc.classList.remove('hidden');
      }
    };
  });

  // 2. SETUP FFMPEG STREAMING PIPELINE
  console.log('Spawning FFmpeg encoder process...');
  const ffmpegArgs = [
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', `${FPS}`,
    '-i', '-', // video stream from stdin
    '-i', audioPath, // subtle ambient soundtrack
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-y', outputVideoPath
  ];

  const ffmpegProc = spawn(ffmpegPath, ffmpegArgs);
  ffmpegProc.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('frame=') && s.includes('fps=')) {
      process.stdout.write(`\r[FFmpeg] ${s.trim().split('\n').pop()}`);
    }
  });

  ffmpegProc.on('error', (err) => console.error('FFmpeg process error:', err));

  // 3. START CDP SCREENCAST FRAME STREAMING
  const client = await page.target().createCDPSession();
  let latestFrameBuffer = null;
  let receivedFrames = 0;

  client.on('Page.screencastFrame', async (frame) => {
    receivedFrames++;
    latestFrameBuffer = Buffer.from(frame.data, 'base64');
    await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
  });

  await client.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });

  // Continuous frame writer loop at fixed 30 FPS to ensure smooth constant frame rate
  let frameIndex = 0;
  const framePumpInterval = setInterval(() => {
    if (latestFrameBuffer && ffmpegProc.stdin.writable) {
      ffmpegProc.stdin.write(latestFrameBuffer);
      frameIndex++;
    }
  }, FRAME_INTERVAL_MS);

  // Helper function to animate smooth mouse movement
  async function smoothMouseMove(startX, startY, endX, endY, steps = 15, delayMs = 25) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Smooth cubic easing
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = Math.round(startX + (endX - startX) * ease);
      const y = Math.round(startY + (endY - startY) * ease);
      await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, false), x, y);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  async function clickAt(x, y) {
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, true), x, y);
    await new Promise(r => setTimeout(r, 120));
    await page.mouse.click(x, y);
    await page.evaluate((cx, cy) => window.setDemoCursor(cx, cy, false), x, y);
    await new Promise(r => setTimeout(r, 150));
  }

  // ====================================================================
  //  SCRIPTED INTERACTIVE DEMO WALKTHROUGH (86 SECONDS TOTAL DURATION)
  // ====================================================================

  console.log('\n--- SCENE 1: OPENING TITLE & RAJASTHAN ROYALS BRAND (0s - 8s) ---');
  await new Promise(r => setTimeout(r, 7000));
  await page.evaluate(() => window.hideTitleCard());
  await new Promise(r => setTimeout(r, 1200));

  console.log('--- SCENE 2: EXECUTIVE INTELLIGENCE & PLAYER EXPLORER (8s - 21s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'MODULE 1: EXECUTIVE INTELLIGENCE & PLAYER EXPLORER',
      'Dual-Phase Pressure Engine (P ∈ [0,1]) • 200,999 Deliveries Analysed'
    );
  });

  // Smooth mouse movement to the KPI cards
  await smoothMouseMove(960, 540, 520, 260, 20, 30);
  await new Promise(r => setTimeout(r, 1200));

  // Smooth scroll down to interactive pitch and pressure meter
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 25));
    await new Promise(r => setTimeout(r, 45));
  }
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Batting Analytics
  await smoothMouseMove(520, 400, 115, 345, 20, 25);
  await clickAt(115, 345);
  await new Promise(r => setTimeout(r, 1800));

  // Inspect Player Modal on Vipraj Nigam
  await smoothMouseMove(115, 345, 520, 520, 20, 25);
  await clickAt(520, 520);
  await new Promise(r => setTimeout(r, 2500));

  // Close Player Modal
  await smoothMouseMove(520, 520, 1260, 240, 15, 25);
  await clickAt(1260, 240);
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- SCENE 3: HIDDEN GEM DETECTOR (21s - 34s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'MODULE 2: HIDDEN GEM DETECTOR',
      'Algorithmic Talent-Discovery Engine • 0–100 Gem Score & Scouting Dossier'
    );
  });

  // Navigate to Hidden Gem Detector in sidebar
  await smoothMouseMove(1260, 240, 115, 480, 20, 25);
  await clickAt(115, 480);
  await new Promise(r => setTimeout(r, 2000));

  // Smooth scroll to inspect gems
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 20));
    await new Promise(r => setTimeout(r, 50));
  }
  await new Promise(r => setTimeout(r, 1200));

  // Click "Why This Player?" on first gem (Asif Khan)
  await smoothMouseMove(115, 480, 420, 680, 20, 25);
  await clickAt(420, 680);
  await new Promise(r => setTimeout(r, 2600));

  // Close scouting modal
  await smoothMouseMove(420, 680, 1220, 240, 15, 25);
  await clickAt(1220, 240);
  await new Promise(r => setTimeout(r, 1000));

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- SCENE 4: YOUNG TALENT RADAR – FUTURE STARS (34s - 47s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'MODULE 3: YOUNG TALENT RADAR (FUTURE STARS DISCOVERY)',
      'Ages 16–23 • NEXT BIG STAR Prospects, Emerging Indian Talents & Watchlist'
    );
  });

  // Navigate to Young Talent Radar in sidebar
  await smoothMouseMove(1220, 240, 115, 545, 20, 25);
  await clickAt(115, 545);
  await new Promise(r => setTimeout(r, 2200));

  // Move across NEXT BIG STAR cards (Jaiswal, Mayank, Vipraj, Tilak, Abhishek)
  await smoothMouseMove(115, 545, 380, 480, 20, 25);
  await new Promise(r => setTimeout(r, 1200));
  await smoothMouseMove(380, 480, 620, 480, 18, 25);
  await new Promise(r => setTimeout(r, 1200));

  // Click Emerging Indian Talent category pill (Fast Bowlers 140+ km/h)
  await smoothMouseMove(620, 480, 450, 245, 20, 25);
  await clickAt(450, 245);
  await new Promise(r => setTimeout(r, 2000));

  // Click Watchlist Tab
  await smoothMouseMove(450, 245, 620, 245, 18, 25);
  await clickAt(620, 245);
  await new Promise(r => setTimeout(r, 2200));

  console.log('--- SCENE 5: BATTER VS BOWLER INTELLIGENCE (47s - 61s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'MODULE 4: BATTER VS BOWLER INTELLIGENCE',
      '200,999 Ball Head-to-Head Duel Matrix • Advantage Indicators & Timelines'
    );
  });

  // Navigate to Batter vs Bowler in sidebar
  await smoothMouseMove(620, 245, 115, 510, 20, 25);
  await clickAt(115, 510);
  await new Promise(r => setTimeout(r, 2000));

  // Select Bowler dropdown to switch matchup
  await smoothMouseMove(115, 510, 850, 275, 20, 25);
  await clickAt(850, 275);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1800));

  // Hover over the Matchup Advantage Indicator
  await smoothMouseMove(850, 275, 680, 420, 20, 25);
  await new Promise(r => setTimeout(r, 2000));

  // Smooth scroll down to delivery timeline and nemeses
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, 25));
    await new Promise(r => setTimeout(r, 45));
  }
  await new Promise(r => setTimeout(r, 2400));

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 800));

  console.log('--- SCENE 6: AI AUCTION WAR ROOM (61s - 76s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'MODULE 5: AI AUCTION WAR ROOM',
      'IPL Virtual Purse Simulator • ₹100 Cr Budget Tracking & Rival AI Counter-Bids'
    );
  });

  // Navigate to AI Auction War Room in sidebar
  await smoothMouseMove(680, 420, 115, 440, 20, 25);
  await clickAt(115, 440);
  await new Promise(r => setTimeout(r, 2000));

  // Hover over Purse remaining
  await smoothMouseMove(115, 440, 360, 260, 20, 25);
  await new Promise(r => setTimeout(r, 1200));

  // Click Raise Bid (+₹50 Lakhs)
  await smoothMouseMove(360, 260, 780, 680, 20, 25);
  await clickAt(780, 680);
  await new Promise(r => setTimeout(r, 1000));

  // Click "Simulate Rival Bid"
  await smoothMouseMove(780, 680, 710, 730, 15, 25);
  await clickAt(710, 730);
  await new Promise(r => setTimeout(r, 1200));

  // Click "Hammer Down (Sold to RR!)"
  await smoothMouseMove(710, 730, 860, 730, 15, 25);
  await clickAt(860, 730);
  await new Promise(r => setTimeout(r, 2000));

  // Click "Build Dream RR Squad"
  await smoothMouseMove(860, 730, 1280, 125, 20, 25);
  await clickAt(1280, 125);
  await new Promise(r => setTimeout(r, 2500));

  // Close Audit modal
  await smoothMouseMove(1280, 125, 1240, 215, 15, 25);
  await clickAt(1240, 215);
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- SCENE 7: CLOSING SUMMARY & EXECUTIVE OUTRO (76s - 86s) ---');
  await page.evaluate(() => {
    window.setDemoLowerThird(
      'SUPERR SELECTOR 2.0 • STRATEGIC SCOUTING INTELLIGENCE',
      'Rajasthan Royals • Data-Driven Excellence Under Pressure'
    );
  });

  // Return to Overview
  await smoothMouseMove(1240, 215, 115, 220, 20, 25);
  await clickAt(115, 220);
  await new Promise(r => setTimeout(r, 2200));

  // Show Outro Title Card
  await page.evaluate(() => {
    window.setDemoLowerThird('', '', false);
    window.showOutroTitleCard();
  });
  await new Promise(r => setTimeout(r, 7000));

  console.log('\nFinalizing recording pipeline...');
  clearInterval(framePumpInterval);
  await client.send('Page.stopScreencast');

  console.log(`Closing FFmpeg stdin (total frames pumped: ${frameIndex})...`);
  ffmpegProc.stdin.end();

  await new Promise((resolve) => {
    ffmpegProc.on('close', (code) => {
      console.log(`\nFFmpeg process exited cleanly with code: ${code}`);
      resolve();
    });
  });

  await browser.close();

  // Verify MP4 file
  if (fs.existsSync(outputVideoPath)) {
    const stats = fs.statSync(outputVideoPath);
    console.log(`\n================================================================`);
    console.log(` SUCCESS! DEMO VIDEO GENERATED: ${outputVideoPath}`);
    console.log(` File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(` Thumbnail: ${thumbnailPath}`);
    console.log(`================================================================\n`);
  } else {
    console.error('ERROR: Video file was not created!');
  }
}

runDemoRecording().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});

