const fs = require('fs');
const zlib = require('zlib');

// 创建一个 32x32 的猫咪图标
const width = 32;
const height = 32;

// 定义颜色
const colors = {
  transparent: [0, 0, 0, 0],
  orange: [222, 136, 109, 255],      // 猫咪主体颜色
  darkOrange: [180, 100, 70, 255],   // 深色部分
  pink: [255, 181, 181, 255],        // 耳朵内部
  black: [0, 0, 0, 255],             // 眼睛、鼻子
  white: [255, 255, 255, 255],       // 眼睛高光
};

// 定义像素数据 (32x32)
const pixels = [];

// 初始化为透明
for (let i = 0; i < width * height; i++) {
  pixels.push([0, 0, 0, 0]);
}

// 设置像素的辅助函数
function setPixel(x, y, color) {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    pixels[y * width + x] = color;
  }
}

// 绘制圆形
function drawCircle(cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        setPixel(cx + x, cy + y, color);
      }
    }
  }
}

// 绘制三角形（耳朵）
function drawTriangle(x1, y1, x2, y2, x3, y3, color) {
  // 简单的三角形绘制
  const minX = Math.min(x1, x2, x3);
  const maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3);
  const maxY = Math.max(y1, y2, y3);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // 简单的点在三角形内判断
      const d1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2);
      const d2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3);
      const d3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1);

      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

      if (!(hasNeg && hasPos)) {
        setPixel(x, y, color);
      }
    }
  }
}

// 绘制猫咪

// 左耳朵
drawTriangle(8, 6, 4, 16, 12, 16, colors.orange);
drawTriangle(9, 8, 6, 14, 11, 14, colors.pink);

// 右耳朵
drawTriangle(24, 6, 20, 16, 28, 16, colors.orange);
drawTriangle(23, 8, 21, 14, 26, 14, colors.pink);

// 脸部
drawCircle(16, 20, 10, colors.orange);

// 左眼
drawCircle(12, 18, 2, colors.black);
setPixel(11, 17, colors.white);

// 右眼
drawCircle(20, 18, 2, colors.black);
setPixel(19, 17, colors.white);

// 鼻子
setPixel(16, 22, colors.pink);
setPixel(15, 22, colors.pink);
setPixel(17, 22, colors.pink);

// 嘴巴
setPixel(14, 24, colors.black);
setPixel(15, 25, colors.black);
setPixel(16, 25, colors.black);
setPixel(17, 25, colors.black);
setPixel(18, 24, colors.black);

// 胡须左边
setPixel(4, 20, colors.black);
setPixel(5, 20, colors.black);
setPixel(6, 20, colors.black);
setPixel(7, 21, colors.black);

setPixel(4, 22, colors.black);
setPixel(5, 22, colors.black);
setPixel(6, 22, colors.black);
setPixel(7, 22, colors.black);

// 胡须右边
setPixel(28, 20, colors.black);
setPixel(27, 20, colors.black);
setPixel(26, 20, colors.black);
setPixel(25, 21, colors.black);

setPixel(28, 22, colors.black);
setPixel(27, 22, colors.black);
setPixel(26, 22, colors.black);
setPixel(25, 22, colors.black);

// 生成 PNG 文件
function createPNG() {
  // PNG 文件头
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // 宽度
  ihdrData.writeUInt32BE(height, 4);  // 高度
  ihdrData.writeUInt8(8, 8);          // 位深度
  ihdrData.writeUInt8(6, 9);          // 颜色类型 (RGBA)
  ihdrData.writeUInt8(0, 10);         // 压缩方法
  ihdrData.writeUInt8(0, 11);         // 滤波方法
  ihdrData.writeUInt8(0, 12);         // 隔行扫描

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (图像数据)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // 滤波类型 (无滤波)
    for (let x = 0; x < width; x++) {
      const pixel = pixels[y * width + x];
      rawData.push(pixel[0]); // R
      rawData.push(pixel[1]); // G
      rawData.push(pixel[2]); // B
      rawData.push(pixel[3]); // A
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  // 组合所有部分
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 计算
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 生成并保存图标
const pngData = createPNG();
fs.writeFileSync('renderer/assets/tray-icon-cat.png', pngData);
console.log('Cat icon generated: renderer/assets/tray-icon-cat.png');
