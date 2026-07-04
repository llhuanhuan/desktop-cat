// ============================================
// Desktop Cat - SVG 猫咪交互控制器
// ============================================

// 状态管理
let cat, catSvg, bubble, bubbleText;
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
        const ox = (Math.random() - 0.5) * 80;
        this._create(x + ox, y, sparkles[Math.floor(Math.random() * sparkles.length)], 'sparkle');
      }, i * 100);
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
// SVG 动画控制
// ============================================
function animateSVG(action) {
  const svgDoc = document.getElementById('cat-svg');
  if (!svgDoc || !svgDoc.contentDocument) return;

  const svg = svgDoc.contentDocument;

  switch (action) {
    case 'blink':
      // 触发眨眼 - 通过修改眼皮动画
      const leftEyelid = svg.querySelector('.eyelid-left');
      const rightEyelid = svg.querySelector('.eyelid-right');
      if (leftEyelid && rightEyelid) {
        leftEyelid.setAttribute('ry', '14');
        rightEyelid.setAttribute('ry', '14');
        setTimeout(() => {
          leftEyelid.setAttribute('ry', '0');
          rightEyelid.setAttribute('ry', '0');
        }, 150);
      }
      break;

    case 'happy':
      // 让眼睛变成眯眼
      const eyes = svg.querySelectorAll('.head circle[fill="white"]');
      eyes.forEach(eye => {
        eye.setAttribute('ry', '6');
        eye.setAttribute('rx', '14');
      });
      setTimeout(() => {
        eyes.forEach(eye => {
          eye.setAttribute('ry', '14');
          eye.setAttribute('rx', '14');
        });
      }, 1500);
      break;
  }
}

// ============================================
// 交互动画
// ============================================

// 任务完成
function playTaskDone() {
  setState('happy', 1800);
  sound.play('happy');
  animateSVG('happy');

  // 粒子效果
  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const cx = rect.left - container.left + rect.width / 2;
  const cy = rect.top - container.top + 20;

  particles.sparkle(cx, cy);
  setTimeout(() => particles.heart(cx, cy - 30), 300);

  // 气泡
  const msgs = ['任务完成！🎉', '搞定啦！✨', '做好了！💖', '喵~ 完成！'];
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

// 点击
function playClick() {
  setState('click', 400);
  sound.play('click');
  animateSVG('blink');

  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  particles.heart(
    rect.left - container.left + rect.width / 2,
    rect.top - container.top + 10
  );

  const msgs = ['喵~ 🐱', '摸摸头~', '呼噜~', '蹭蹭~', '喜欢你！', '嘿嘿~', '再摸摸~'];
  showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
}

// 悬停
function playHover() {
  cat.classList.add('hover');
  showBubble('喵？', 1000);
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
  cat = document.getElementById('cat');
  catSvg = document.getElementById('cat-svg');
  bubble = document.getElementById('bubble');
  bubbleText = bubble.querySelector('.bubble-text');

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

  // 随机眨眼
  setInterval(() => {
    if (currentState === 'idle' && Math.random() < 0.3) {
      animateSVG('blink');
    }
  }, 5000);

  // 随机动作
  setInterval(() => {
    if (currentState === 'idle' && Math.random() < 0.2) {
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      particles.star(
        rect.left - container.left + rect.width / 2,
        rect.top - container.top
      );
      showBubble('...', 1000);
    }
  }, 20000);

  console.log('[Desktop Cat] Initialized with SVG');
});
