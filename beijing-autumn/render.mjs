// 把 index.html 里的短片逐帧渲染成 MP4。
//
//   npm install playwright && npx playwright install chromium
//   node beijing-autumn/render.mjs --out beijing-autumn.mp4
//
// 参数：--out 文件名  --width 画面宽度（默认 1920）  --fps 帧率（默认 30）
//       --from / --to 只渲染其中一段（秒）  --ffmpeg ffmpeg 的路径（也可用环境变量 FFMPEG）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i];
}
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(args.out || 'beijing-autumn.mp4');
const width = Number(args.width || 1920);
const fps = Number(args.fps || 30);
const ffmpeg = args.ffmpeg || process.env.FFMPEG || 'ffmpeg';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.error('页面报错：', e.message));
await page.goto(pathToFileURL(path.join(here, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.BJ_AUTUMN.fontsReady);
const duration = await page.evaluate(() => window.BJ_AUTUMN.duration);
const from = Number(args.from || 0);
const to = Math.min(Number(args.to || duration), duration);

// 1. 音轨：OfflineAudioContext 一次渲染完，存成 WAV
const tmp = await mkdtemp(path.join(tmpdir(), 'bj-autumn-'));
const wavPath = path.join(tmp, 'soundtrack.wav');
process.stdout.write('渲染音轨…');
await writeFile(wavPath, Buffer.from(await page.evaluate(() => window.BJ_AUTUMN.soundtrack()), 'base64'));
console.log(' 完成');

// 2. 画面：一帧一帧画成 JPEG，经管道交给 ffmpeg 编码，再和音轨合在一起
const ff = spawn(ffmpeg, [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-ss', String(from), '-t', String(to - from), '-i', wavPath,
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((resolve, reject) => {
  ff.on('error', reject);
  ff.on('close', code => (code ? reject(new Error(`ffmpeg 退出码 ${code}`)) : resolve()));
});
const frames = Math.round((to - from) * fps);
for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  const url = await page.evaluate(([t, w]) => window.BJ_AUTUMN.frame(t, w), [t, width]);
  const jpeg = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  if (!ff.stdin.write(jpeg)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r画面 ${Math.round(t - from)} / ${Math.round(to - from)} 秒`);
}
ff.stdin.end();
await done;
await browser.close();
await rm(tmp, { recursive: true, force: true });
console.log(`\n已写入 ${out}`);
