// ZzFX - Zuper Zmall Zound Zynth - Micro Edition - MIT License
// https://github.com/KilledByAPixel/ZzFX
'use strict';

const zzfxV = .3; // 音量
const zzfxX = new (window.AudioContext || window.webkitAudioContext)();

function zzfx(p = []) {
  // 参数: [音量, 随机性, 频率, 起音, 持续, 释放, 波形, 波形曲线, 滑音, delta滑音, 音高跳, 音高跳时间, 重复时间, 噪声, 调制, 压碎, 延迟, 持续音量, 衰减, 颤音]
  let [
    volume = 1,
    randomness = .05,
    frequency = 220,
    attack = 0,
    sustain = .1,
    release = .1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = .1,
    decay = 0,
    tremolo = 0
  ] = p;

  // 初始化
  let PI2 = Math.PI * 2,
    sampleRate = 44100,
    startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
    startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / sampleRate,
    b = [],
    t = 0,
    tm = 0,
    i = 0,
    j = 1,
    r = 0,
    c = 0,
    s = 0,
    f,
    length;

  // 生成波形
  attack = attack * sampleRate + 9;
  decay = decay * sampleRate;
  sustain = sustain * sampleRate;
  release = release * sampleRate;
  delay = delay * sampleRate;
  deltaSlide *= 500 * PI2 / sampleRate ** 3;
  modulation *= PI2 / sampleRate;
  pitchJump *= PI2 / sampleRate;
  pitchJumpTime *= sampleRate;
  repeatTime = repeatTime * sampleRate | 0;
  volume *= zzfxV;
  length = attack + decay + sustain + release + delay | 0;

  // 生成样本
  for (; i < length; b[i++] = s * volume) {
    if (!(++c % (bitCrush * 100 | 0))) {
      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?
        Math.sin((t % PI2) ** 3) :
        Math.max(Math.min(Math.tan(t), 1), -1) :
        1 - (2 * t / PI2 % 2 + 2) % 2 :
        1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) :
        Math.sin(t);

      s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(2 * Math.PI * i / repeatTime) : 1) *
        (s > 0 ? 1 : -1) * Math.abs(s) ** shapeCurve *
        (i < attack ? i / attack :
          i < attack + decay ?
          1 - ((i - attack) / decay) * (1 - sustainVolume) :
          i < attack + decay + sustain ?
          sustainVolume :
          i < length - delay ?
          (length - i - delay) / release * sustainVolume : 0);

      s = delay ? s / 2 + (delay > i ? 0 :
        (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2) : s;
    }

    f = (frequency += slide += deltaSlide) * Math.cos(modulation * tm++);
    t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);

    if (j && ++j > pitchJumpTime) {
      frequency += pitchJump;
      j = 0;
    }

    if (repeatTime && !(++r % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      j = j || 1;
    }
  }

  // 创建音频缓冲区并播放
  const buffer = zzfxX.createBuffer(1, length, sampleRate);
  buffer.getChannelData(0).set(b.map(v => Math.max(-1, Math.min(1, v))));

  const source = zzfxX.createBufferSource();
  source.buffer = buffer;
  source.connect(zzfxX.destination);
  source.start();

  return source;
}
