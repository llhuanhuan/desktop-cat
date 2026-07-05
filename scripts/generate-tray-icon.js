const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '..', 'renderer', 'assets', 'lhuan.png');
const output = path.join(__dirname, '..', 'renderer', 'assets', 'tray-icon.png');

// 2048x2048 原图，裁剪猫咪头部区域（居中偏上），然后缩放
sharp(input)
  .extract({ left: 500, top: 200, width: 1100, height: 1100 }) // 裁剪头部
  .resize(64, 64, { kernel: 'lanczos3' }) // 高质量缩放
  .png()
  .toFile(output)
  .then(() => console.log('Tray icon generated:', output))
  .catch(err => console.error('Error:', err));
