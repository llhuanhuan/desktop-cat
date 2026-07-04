// ============================================
// Desktop Cat - 图片猫咪交互控制器
// ============================================

let cat, bubble, bubbleText;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentState = 'idle';
let stateTimer = null;

// ============================================
// 音效
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
        this._tone(600, 0.15, 0.3);
        setTimeout(() => this._tone(500, 0.2, 0.25), 150);
        break;
      case 'click':
        this._tone(800, 0.08, 0.2);
        break;
      case 'happy':
        this._tone(523, 0.15, 0.2);
        setTimeout(() => this._tone(659, 0.15, 0.2), 100);
        setTimeout(() => this._tone(784, 0.2, 0.25), 200);
        break;
    }
  },

  _tone(freq, dur, vol) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// ============================================
// 粒子
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
  setTimeout(() => bubble.classList.remove('show'), duration);
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
// 交互
// ============================================
function playTaskDone() {
  setState('happy', 1800);
  sound.play('happy');

  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const cx = rect.left - container.left + rect.width / 2;
  const cy = rect.top - container.top;

  particles.sparkle(cx, cy);
  setTimeout(() => particles.heart(cx, cy - 20), 300);

  const msgs = ['任务完成！🎉', '搞定啦！✨', '做好了！💖'];
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

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

function playHover() {
  cat.classList.add('hover');
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
document.addEventListener('DOMContentLoaded', () => {
  cat = document.getElementById('cat');
  bubble = document.getElementById('bubble');
  bubbleText = bubble.querySelector('.bubble-text');

  initDrag();

  if (window.electronAPI) {
    window.electronAPI.onTaskDone(() => playTaskDone());
  }

  cat.addEventListener('click', () => {
    if (!isDragging) playClick();
  });

  cat.addEventListener('dblclick', (e) => {
    if (!isDragging) {
      e.preventDefault();
      toggleSleep();
    }
  });

  cat.addEventListener('mouseenter', () => {
    if (!isDragging && currentState !== 'sleeping') playHover();
  });

  cat.addEventListener('mouseleave', stopHover);

  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = sound.toggle();
    showBubble(enabled ? '🔊 音效开' : '🔇 音效关', 1500);
  });

  // 随机动作
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

  console.log('[Desktop Cat] Initialized with image');
});
