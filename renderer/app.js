// ============================================
// Desktop Cat - 交互控制器
// ============================================

// 状态管理
let cat, head, body, tail;
let bubble, bubbleText;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentState = 'idle';
let stateTimer = null;

// ============================================
// 音效管理
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

    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (type) {
      case 'meow':
        this._playTone(600, 0.15, 'sine', 0.3);
        setTimeout(() => this._playTone(500, 0.2, 'sine', 0.25), 150);
        break;
      case 'click':
        this._playTone(800, 0.08, 'sine', 0.2);
        break;
      case 'happy':
        this._playTone(523, 0.15, 'sine', 0.2);
        setTimeout(() => this._playTone(659, 0.15, 'sine', 0.2), 100);
        setTimeout(() => this._playTone(784, 0.2, 'sine', 0.25), 200);
        break;
    }
  },

  _playTone(freq, duration, type = 'sine', volume = 0.3) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// ============================================
// 粒子系统
// ============================================
const particles = {
  heart(x, y) {
    const hearts = ['❤️', '💕', '💖', '💗'];
    this._create(x, y, hearts[Math.floor(Math.random() * hearts.length)], 'heart');
  },

  star(x, y) {
    this._create(x, y, '⭐', 'star');
  },

  sparkle(x, y) {
    const sparkles = ['✨', '💫', '🌟'];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ox = (Math.random() - 0.5) * 60;
        this._create(x + ox, y, sparkles[Math.floor(Math.random() * sparkles.length)], 'sparkle');
      }, i * 80);
    }
  },

  _create(x, y, text, cls) {
    const el = document.createElement('div');
    el.className = `particle ${cls}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.getElementById('cat-container').appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
};

// ============================================
// 状态控制
// ============================================
function setState(state, duration) {
  if (stateTimer) clearTimeout(stateTimer);

  cat.classList.remove(currentState);
  currentState = state;
  cat.classList.add(state);

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

  setTimeout(() => {
    bubble.classList.remove('show');
  }, duration);
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
      document.getElementById('cat-container').style.cursor = 'grab';
    }
  });
}

// ============================================
// 交互动画
// ============================================

// 任务完成
function playTaskDone() {
  setState('happy', 1500);
  sound.play('happy');

  // 粒子
  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const cx = rect.left - container.left + rect.width / 2;
  const cy = rect.top - container.top;

  particles.sparkle(cx, cy);
  setTimeout(() => particles.heart(cx, cy - 20), 200);

  // 气泡
  const msgs = ['任务完成！🎉', '搞定啦！✨', '做好了！💖'];
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

// 点击
function playClick() {
  setState('click', 400);
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

// 悬停
function playHover() {
  cat.classList.add('hover');
  showBubble('喵？', 800);
}

function stopHover() {
  cat.classList.remove('hover');
}

// 睡眠
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
document.addEventListener('DOMContentLoaded', () => {
  // 获取元素
  cat = document.getElementById('cat');
  head = cat.querySelector('.head');
  body = cat.querySelector('.body');
  tail = cat.querySelector('.tail');
  bubble = document.getElementById('bubble');
  bubbleText = bubble.querySelector('.bubble-text');

  // 初始化
  initDrag();

  // 监听任务完成
  if (window.electronAPI) {
    window.electronAPI.onTaskDone(() => {
      playTaskDone();
    });
  }

  // 点击
  cat.addEventListener('click', (e) => {
    if (!isDragging) playClick();
  });

  // 双击睡眠
  cat.addEventListener('dblclick', (e) => {
    if (!isDragging) {
      e.preventDefault();
      toggleSleep();
    }
  });

  // 悬停
  cat.addEventListener('mouseenter', () => {
    if (!isDragging && currentState !== 'sleeping') playHover();
  });

  cat.addEventListener('mouseleave', stopHover);

  // 右键切换音效
  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = sound.toggle();
    showBubble(enabled ? '🔊 音效开' : '🔇 音效关', 1500);
  });

  // 随机动作
  setInterval(() => {
    if (currentState === 'idle' && Math.random() < 0.2) {
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      const cx = rect.left - container.left + rect.width / 2;
      const cy = rect.top - container.top + 10;
      particles.star(cx, cy);
      showBubble('...', 1000);
    }
  }, 15000);

  console.log('[Desktop Cat] Initialized');
});
