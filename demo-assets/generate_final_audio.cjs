const { execFileSync } = require('child_process');
const path = require('path');

const ffmpegPath = path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

function generateAudio(durationSec, outputPath) {
  const dur = Math.max(5, Number(durationSec) || 100);
  const fadeOutStart = Math.max(0.5, dur - 3.5).toFixed(2);
  const durStr = dur.toFixed(2);

  // Clean, warm sports-broadcast stereo ambient underscore:
  // normalize=0 prevents multi-stage amix attenuation; target ~ -21 dB mean loudness.
  const filterComplex = [
    `sine=frequency=55:duration=${durStr}:sample_rate=44100[b1]`,
    `sine=frequency=82.41:duration=${durStr}:sample_rate=44100[b2]`,
    `[b1][b2]amix=inputs=2:normalize=0[bass]`,
    `sine=frequency=220:duration=${durStr}:sample_rate=44100[p1]`,
    `sine=frequency=277.18:duration=${durStr}:sample_rate=44100[p2]`,
    `sine=frequency=329.63:duration=${durStr}:sample_rate=44100[p3]`,
    `[p1][p2][p3]amix=inputs=3:normalize=0,tremolo=f=0.22:d=0.35[pad]`,
    `sine=frequency=440:duration=${durStr}:sample_rate=44100,tremolo=f=0.45:d=0.5[shimmer]`,
    `sine=frequency=164.81:duration=${durStr}:sample_rate=44100,tremolo=f=2.0:d=0.92[pulse]`,
    `[bass]volume=0.35[vb]`,
    `[pad]volume=0.18[vp]`,
    `[shimmer]volume=0.06[vs]`,
    `[pulse]volume=0.08[vpulse]`,
    `[vb][vp][vs][vpulse]amix=inputs=4:normalize=0[mix]`,
    `[mix]lowpass=f=1100,pan=stereo|c0=0.95*c0|c1=0.95*c0,aecho=0.7:0.75:35|65:0.18|0.14,afade=t=in:ss=0:d=2.5,afade=t=out:st=${fadeOutStart}:d=3.5,volume=3.4[outa]`
  ].join('; ');

  const args = [
    '-f', 'lavfi',
    '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,
    '-filter_complex', filterComplex,
    '-map', '[outa]',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', durStr,
    '-y', outputPath,
  ];

  execFileSync(ffmpegPath, args, { stdio: 'inherit' });
  return outputPath;
}

if (require.main === module) {
  const dur = process.argv[2] ? parseFloat(process.argv[2]) : 102;
  const out = process.argv[3] || path.join(__dirname, 'ambient_bg_final.aac');
  generateAudio(dur, out);
}

module.exports = { generateAudio };

