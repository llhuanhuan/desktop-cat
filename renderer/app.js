// ============================================
// Desktop Cat - SVG 猫咪交互控制器
// ============================================

let cat, bubble, bubbleText, svgWrapper;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentState = 'idle';
let stateTimer = null;
let svgCache = {};

// 主题文件映射（8 个状态）
const THEME_MAP = {
  idle: 'assets/cat/processed/idle.png',
  happy: 'assets/cat/processed/happy.png',
  sleeping: 'assets/cat/processed/sleeping.png',
  thinking: 'assets/cat/processed/thinking.png',
  working: 'assets/cat/processed/working.png',
  error: 'assets/cat/processed/error.png',
  notification: 'assets/cat/processed/notification.png',
  waking: 'assets/cat/processed/waking.png'
};

// 状态对应的气泡消息
const STATE_MESSAGES = {
  thinking: ['思考中...', '让我想想...', '嗯...'],
  working: ['干活中...', '写代码中...', '马上就好...'],
  error: ['出错了！', '遇到了问题...', '需要帮忙...'],
  happy: ['搞定啦！✨', '任务完成！🎉', '做好了！💖']
};

// ============================================
// 主题加载器
// ============================================
async function loadTheme(state) {
  if (svgCache[state]) return svgCache[state];

  try {
    const response = await fetch(THEME_MAP[state]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    svgCache[state] = url;
    return url;
  } catch (e) {
    console.error(`[Desktop Cat] Failed to load theme: ${state}`, e);
    return null;
  }
}

async function setThemeState(state) {
  const url = await loadTheme(state);
  if (url && svgWrapper) {
    svgWrapper.innerHTML = `<img src="${url}" alt="${state}" style="width:100%;height:100%;object-fit:contain;">`;
  }
}

// ============================================
// 音效 - 猫咪主题音效系统
// ============================================
const sound = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  play(type) {
    if (!this.enabled) return;
    this.init();

    switch (type) {
      case 'meow':
        this._meow();
        break;
      case 'click':
        this._purr();
        break;
      case 'happy':
        this._happyMeow();
        break;
      case 'error':
        this._hiss();
        break;
      case 'thinking':
        this._chirp();
        break;
      case 'sleep':
        this._sleepyMeow();
        break;
    }
  },

  // 柔和的猫叫声 - 可爱的"喵~"
  _meow() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // 柔和的正弦波，较低的频率
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.35);

    // 低通滤波器 - 去掉尖锐的高频
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1, now);

    // 柔和的音量包络
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  },

  // 轻柔的呼噜声
  _purr() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    // 低频正弦波
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);

    // 轻微的频率调制
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(15, now);
    lfoGain.gain.setValueAtTime(10, now);

    // 非常轻柔的音量
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.45);
    lfo.stop(now + 0.45);
  },

  // 开心的短促喵声
  _happyMeow() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 两声轻快的喵
    const notes = [
      { start: 0, freq: 450, dur: 0.12 },
      { start: 0.15, freq: 500, dur: 0.15 }
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const t = now + note.start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t);
      osc.frequency.exponentialRampToValueAtTime(note.freq * 1.1, t + note.dur * 0.5);
      osc.frequency.exponentialRampToValueAtTime(note.freq * 0.9, t + note.dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, t);
      filter.Q.setValueAtTime(1, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.dur + 0.01);
    });
  },

  // 轻柔的不满声
  _hiss() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 使用柔和的低音代替嘶嘶声
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.setValueAtTime(1, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  },

  // 轻柔的啾啾声
  _chirp() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 一声轻柔的啾
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  },

  // 困倦的低沉喵声
  _sleepyMeow() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // 非常低沉的频率
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.setValueAtTime(1, now);

    // 缓慢轻柔的音量
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// ============================================
// 粒子效果
// ============================================
const particles = {
  heart(x, y) {
    const list = ['❤️', '💕', '💖', '💗'];
    this._add(x, y, list[Math.floor(Math.random() * list.length)], 'heart');
  },

  star(x, y) {
    this._add(x, y, '⭐', 'star');
  },

  sparkle(x, y) {
    const list = ['✨', '💫', '🌟'];
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const ox = (Math.random() - 0.5) * 80;
        this._add(x + ox, y, list[Math.floor(Math.random() * list.length)], 'sparkle');
      }, i * 100);
    }
  },

  _add(x, y, text, cls) {
    const el = document.createElement('div');
    el.className = `particle ${cls}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.getElementById('cat-container').appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
};

// ============================================
// 状态控制
// ============================================
function setState(state, duration) {
  if (stateTimer) clearTimeout(stateTimer);
  const prevState = currentState;
  currentState = state;

  // 切换主题动画
  setThemeState(state);

  // 状态变化音效
  if (state !== prevState) {
    if (state === 'thinking') sound.play('thinking');
    else if (state === 'error') sound.play('error');
    else if (state === 'happy') sound.play('happy');
    else if (state === 'sleeping') sound.play('sleep');
    else if (state === 'working') sound.play('meow');
  }

  if (duration) {
    stateTimer = setTimeout(() => setState('idle'), duration);
  }
}

// ============================================
// 气泡
// ============================================
function showBubble(text, duration = 2000) {
  if (!bubble) return;
  bubbleText.textContent = text;
  bubble.classList.add('show');
  setTimeout(() => bubble.classList.remove('show'), duration);
}

// ============================================
// 点击穿透控制
// ============================================
function enableClickThrough() {
  if (window.electronAPI) {
    window.electronAPI.setIgnoreMouse(true);
  }
}

function disableClickThrough() {
  if (window.electronAPI) {
    window.electronAPI.setIgnoreMouse(false);
  }
}

// ============================================
// 拖拽
// ============================================
function initDrag() {
  const container = document.getElementById('cat-container');

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    container.style.cursor = 'grabbing';
    disableClickThrough(); // 拖拽时禁用穿透
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (window.electronAPI) {
      window.electronAPI.moveWindow(dx, dy);
    }
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
      // 拖拽结束后恢复穿透（鼠标不在猫咪上时）
      if (!cat.matches(':hover')) {
        enableClickThrough();
      }
    }
  });
}

// ============================================
// 交互
// ============================================
function playTaskDone() {
  setState('happy', 3000);
  sound.play('happy');

  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const cx = rect.left - container.left + rect.width / 2;
  const cy = rect.top - container.top;

  particles.sparkle(cx, cy);
  setTimeout(() => particles.heart(cx, cy - 20), 300);

  const msgs = STATE_MESSAGES.happy;
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

function playClick() {
  cat.classList.add('click');
  setTimeout(() => cat.classList.remove('click'), 400);
  sound.play('click');

  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  particles.heart(
    rect.left - container.left + rect.width / 2,
    rect.top - container.top + 10
  );

  const msgs = ['喵~ 🐱', '摸摸头~', '呼噜~', '蹭蹭~', '喜欢你！', '嘿嘿~'];
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

function playHover() {
  cat.classList.add('hover');
  sound.play('meow');
  showBubble('喵？', 1000);
}

function stopHover() {
  cat.classList.remove('hover');
}

function toggleSleep() {
  if (currentState === 'sleeping') {
    setState('idle');
    showBubble('伸懒腰~ 😴');
  } else {
    setState('sleeping');
    showBubble('困了... 💤');
  }
}

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  cat = document.getElementById('cat');
  bubble = document.getElementById('bubble');
  bubbleText = bubble.querySelector('.bubble-text');
  svgWrapper = document.getElementById('cat-svg-wrapper');

  // 预加载所有主题图片
  await Promise.all([
    loadTheme('idle'),
    loadTheme('happy'),
    loadTheme('sleeping'),
    loadTheme('thinking'),
    loadTheme('working'),
    loadTheme('error'),
    loadTheme('notification'),
    loadTheme('waking')
  ]);

  // 设置初始状态
  await setThemeState('idle');

  initDrag();

  // 监听 Claude Code 状态变化
  if (window.electronAPI) {
    window.electronAPI.onStateChange((data) => {
      const { state, event, detail, project } = data;
      console.log(`[Desktop Cat] State: ${state} (event: ${event}, project: ${project})`);

      // 根据状态设置持续时间
      let duration = null;
      if (state === 'happy') duration = 3000;
      else if (state === 'error') duration = 5000;

      setState(state, duration);

      // 显示状态气泡（带项目名）
      const msgs = STATE_MESSAGES[state];
      if (msgs) {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const projectText = project ? `[${project}] ` : '';
        const detailText = detail ? ` - ${detail}` : '';
        showBubble(projectText + msg + detailText, 2000);
      }
    });

    // 兼容旧接口
    window.electronAPI.onTaskDone(() => playTaskDone());
  }

  // 点击事件
  cat.addEventListener('click', () => {
    if (!isDragging) playClick();
  });

  // 双击切换睡眠
  cat.addEventListener('dblclick', (e) => {
    if (!isDragging) {
      e.preventDefault();
      toggleSleep();
    }
  });

  // 悬停：禁用穿透 + 显示气泡
  cat.addEventListener('mouseenter', () => {
    disableClickThrough();
    if (!isDragging && currentState !== 'sleeping') playHover();
  });

  // 离开：恢复穿透
  cat.addEventListener('mouseleave', () => {
    stopHover();
    if (!isDragging) {
      enableClickThrough();
    }
  });

  // 右键切换音效
  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = sound.toggle();
    showBubble(enabled ? '🔊 音效开' : '🔇 音效关', 1500);
  });

  // 随机动作（空闲时）
  setInterval(() => {
    if (currentState === 'idle' && Math.random() < 0.25) {
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      particles.star(
        rect.left - container.left + rect.width / 2,
        rect.top - container.top
      );
      const msgs = ['...', '喵~', '🤔', '😊'];
      showBubble(msgs[Math.floor(Math.random() * msgs.length)], 1200);
    }
  }, 15000);

  console.log('[Desktop Cat] Initialized with 6 SVG states + click-through');
});
