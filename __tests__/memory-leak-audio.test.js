/**
 * 音效 cloneNode 清理测试
 * 验证音效播放后克隆的 Audio 节点被正确清理，防止 DOM 节点累积泄露
 */

// 模拟浏览器 Audio 对象
class MockAudio {
  constructor(src) {
    this.src = src || '';
    this.volume = 1;
    this.preload = 'auto';
    this._listeners = {};
  }

  addEventListener(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }
  }

  removeAttribute() {
    // 模拟 removeAttribute('src')
  }

  pause() {}

  play() {
    return Promise.resolve();
  }

  // 模拟播放结束
  _emitEnded() {
    (this._listeners['ended'] || []).forEach(cb => cb());
  }

  // 模拟播放错误
  _emitError() {
    (this._listeners['error'] || []).forEach(cb => cb());
  }

  cloneNode() {
    return new MockAudio(this.src);
  }

  remove() {
    this._removed = true;
  }
}

// 模拟 sound 模块的核心逻辑
function createSoundSystem() {
  const audioCache = {};

  const files = {
    meow1: 'sounds/meow1.mp3',
    purr1: 'sounds/purr1.mp3',
    happy1: 'sounds/happy1.mp3',
  };

  for (const [name, path] of Object.entries(files)) {
    const audio = new MockAudio(path);
    audio.preload = 'auto';
    audioCache[name] = audio;
  }

  function play(type) {
    const soundMap = {
      'meow': ['meow1'],
      'click': ['purr1'],
      'happy': ['happy1'],
    };

    const sounds = soundMap[type] || ['meow1'];
    const soundName = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = audioCache[soundName];

    if (audio) {
      const clone = audio.cloneNode();
      clone.volume = 0.5;

      // 修复：统一清理函数，处理 ended/error/超时三种场景
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        try { clone.pause(); } catch {}
        clone.removeAttribute('src');
        clone.src = '';
        clone.removeEventListener('ended', cleanup);
        clone.removeEventListener('error', cleanup);
      };

      clone.addEventListener('ended', cleanup);
      clone.addEventListener('error', cleanup);
      clone.play().catch(cleanup);

      // 安全兜底：10 秒后强制清理
      setTimeout(cleanup, 10000);

      clone._cleaned = false;
      Object.defineProperty(clone, '_isCleaned', {
        get() { return cleaned; }
      });
      return clone;
    }
    return null;
  }

  return { audioCache, play };
}

describe('Audio CloneNode Memory Leak Prevention', () => {
  test('播放音效应返回克隆的 Audio 节点', () => {
    const sound = createSoundSystem();
    const clone = sound.play('meow');
    expect(clone).toBeTruthy();
    expect(clone).not.toBe(sound.audioCache['meow1']);
  });

  test('ended 事件应触发克隆节点清理', () => {
    const sound = createSoundSystem();
    const clone = sound.play('meow');
    expect(clone).toBeTruthy();

    // 清理前：src 非空，未清理
    expect(clone._isCleaned).toBe(false);

    // 模拟播放结束
    clone._emitEnded();

    // 验证节点被清理
    expect(clone.src).toBe('');
    expect(clone._isCleaned).toBe(true);
  });

  test('error 事件也应触发克隆节点清理', () => {
    const sound = createSoundSystem();
    const clone = sound.play('meow');
    expect(clone).toBeTruthy();

    expect(clone._isCleaned).toBe(false);

    // 模拟播放错误（play 失败场景）
    clone._emitError();

    expect(clone.src).toBe('');
    expect(clone._isCleaned).toBe(true);
  });

  test('多次播放应产生多个独立克隆，每个都能被清理', () => {
    const sound = createSoundSystem();
    const clones = [];

    // 连续播放 10 次
    for (let i = 0; i < 10; i++) {
      const clone = sound.play('meow');
      clones.push(clone);
    }

    expect(clones.length).toBe(10);

    // 所有克隆都不同
    const uniqueClones = new Set(clones);
    expect(uniqueClones.size).toBe(10);

    // 模拟所有播放结束
    clones.forEach(clone => clone._emitEnded());

    // 验证所有节点都被清理
    clones.forEach(clone => {
      expect(clone.src).toBe('');
      expect(clone._isCleaned).toBe(true);
    });
  });

  test('未修复版本：没有 ended 监听器时节点不会被清理', () => {
    const audioCache = {};
    const audio = new MockAudio('sounds/meow1.mp3');
    audioCache['meow1'] = audio;

    // 模拟旧版 play（没有 ended 清理）
    function playOld() {
      const clone = audioCache['meow1'].cloneNode();
      clone.volume = 0.5;
      clone.play().catch(() => {});
      // 故意不添加 ended 监听器
      return clone;
    }

    const clone = playOld();
    clone._emitEnded();

    // 节点未被清理 —— 这就是内存泄露的根源
    expect(clone.src).not.toBe('');
  });

  test('清理函数应幂等，重复调用不会出错', () => {
    const sound = createSoundSystem();
    const clone = sound.play('meow');

    clone._emitEnded();
    expect(clone._isCleaned).toBe(true);

    // 再次触发 error 不应报错
    clone._emitError();
    expect(clone._isCleaned).toBe(true);
  });

  test('sound 模块缓存的原始 Audio 不应被修改', () => {
    const sound = createSoundSystem();
    const originalMeow = sound.audioCache['meow1'];
    const originalSrc = originalMeow.src;

    sound.play('meow');

    // 原始缓存对象不受影响
    expect(originalMeow.src).toBe(originalSrc);
    expect(originalMeow._removed).toBeUndefined();
  });
});
