// 音效生成器 - 使用 Web Audio API 生成简单音效
// 无需外部音频文件

class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  // 初始化音频上下文
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('[SoundGenerator] Initialized');
    } catch (e) {
      console.warn('[SoundGenerator] Failed to initialize:', e);
    }
  }

  // 生成猫叫声
  generateMeow() {
    if (!this.initialized) this.init();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 创建振荡器
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // 猫叫声频率参数
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(500, now + 0.3);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(650, now);
    osc2.frequency.exponentialRampToValueAtTime(450, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(550, now + 0.3);

    // 音量控制
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    // 连接节点
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 播放
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);

    console.log('[SoundGenerator] Meow played');
  }

  // 生成点击音效
  generateClick() {
    if (!this.initialized) this.init();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // 短促的高音
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.1);

    console.log('[SoundGenerator] Click played');
  }

  // 生成成功音效
  generateSuccess() {
    if (!this.initialized) this.init();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 三音上升音阶
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);

      gainNode.gain.setValueAtTime(0.2, now + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);

      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });

    console.log('[SoundGenerator] Success played');
  }
}

// 导出单例
window.soundGenerator = new SoundGenerator();
