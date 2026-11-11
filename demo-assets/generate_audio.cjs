const { execSync } = require('child_process');
const path = require('path');

const ffmpegPath = path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const outputPath = path.join(__dirname, 'ambient_bg_music.aac');

// Generate an 86-second subtle futuristic corporate sports pulse soundtrack
// 1. Warm bass synth chord (A major / D major progression feel)
// 2. High subtle rhythmic tick (pulse)
// 3. Low-pass filtered warm harmonics with smooth fade-in and fade-out
const filterComplex = [
  // Tone 1: Sub bass pulse 55Hz & 110Hz
  "sine=frequency=55:duration=86[b1]; sine=frequency=110:duration=86[b2]; [b1][b2]amix=inputs=2[bass]",
  // Tone 2: Mid ambient synth drone (220Hz & 330Hz)
  "sine=frequency=220:duration=86[m1]; sine=frequency=330:duration=86[m2]; [m1][m2]amix=inputs=2[mid]",
  // Tone 3: High melodic shimmer (440Hz & 554.37Hz)
  "sine=frequency=440:duration=86[h1]; sine=frequency=554.37:duration=86[h2]; [h1][h2]amix=inputs=2[high]",
  // Rhythmic clock pulse (subtle metronomic tech heartbeat at 120 bpm = 2Hz)
  "sine=frequency=880:duration=86, tremolo=f=2.0:d=0.9[pulse]",
  // Mix all layers with balanced volumes
  "[bass]volume=0.45[vbass]; [mid]volume=0.18[vmid]; [high]volume=0.08[vhigh]; [pulse]volume=0.05[vpulse]",
  "[vbass][vmid][vhigh][vpulse]amix=inputs=4:duration=first[mixed]",
  // Add smooth lowpass warmth, 3s fade-in, and 4s fade-out
  "[mixed]lowpass=f=2400, afade=t=in:ss=0:d=3, afade=t=out:st=82:d=4, volume=0.85[outa]"
].join('; ');

const cmd = `"${ffmpegPath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -filter_complex "${filterComplex}" -map "[outa]" -c:a aac -b:a 192k -t 86 -y "${outputPath}"`;

console.log('Generating ambient background soundtrack...');
execSync(cmd, { stdio: 'inherit' });
console.log('Ambient soundtrack successfully created at:', outputPath);

