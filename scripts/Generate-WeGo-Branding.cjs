// Reuse the supplied wordmark; leave space for Android's circular adaptive/splash masks.
const Jimp = require('jimp-compact');
const path = require('node:path');

async function main() {
  const directory = path.join(__dirname, '../assets/images');
  const wordmark = await Jimp.read(path.join(directory, 'wego-wordmark.png'));
  for (const [name, width, background] of [
    ['wego-icon.png', 720, 0xffffffff],
    ['wego-adaptive.png', 560, 0x00000000],
    ['wego-splash.png', 560, 0xffffffff],
  ]) {
    const logo = wordmark.clone().resize(width, Jimp.AUTO);
    const canvas = new Jimp(1024, 1024, background);
    canvas.composite(logo, Math.round((1024 - logo.bitmap.width) / 2),
      Math.round((1024 - logo.bitmap.height) / 2));
    await canvas.writeAsync(path.join(directory, name));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
