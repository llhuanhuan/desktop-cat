// ============================================
// Desktop Cat - SVG 猫咪交互控制器
// ============================================

let cat, bubble, bubbleText, svgWrapper;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentState = 'idle';
let stateTimer = null;
let svgCache = {};

// SVG 文件映射（6 个状态）
const SVG_MAP = {
  idle: 'assets/clawd-idle.svg',
  happy: 'assets/clawd-happy.svg',
  sleeping: 'assets/clawd-sleeping.svg',
  thinking: 'assets/clawd-working-thinking.svg',
  working: 'assets/clawd-working-typing.svg',
  error: 'assets/clawd-error.svg'
};

// 状态对应的气泡消息
const STATE_MESSAGES = {
  thinking: ['思考中...', '让我想想...', '嗯...'],
  working: ['干活中...', '写代码中...', '马上就好...'],
  error: ['出错了！', '遇到了问题...', '需要帮忙...'],
  happy: ['搞定啦！✨', '任务完成！🎉', '做好了！💖']
};

// ============================================
// SVG 加载器
// ============================================
async function loadSVG(state) {
  if (svgCache[state]) return svgCache[state];

  try {
    const response = await fetch(SVG_MAP[state]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const svgText = await response.text();
    svgCache[state] = svgText;
    return svgText;
  } catch (e) {
    console.error(`[Desktop Cat] Failed to load SVG: ${state}`, e);
    return null;
  }
}

async function setSVGState(state) {
  const svgText = await loadSVG(state);
  if (svgText && svgWrapper) {
    svgWrapper.innerHTML = svgText;
  }
}

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
      case 'error':
        this._tone(300, 0.2, 0.3);
        setTimeout(() => this._tone(200, 0.3, 0.25), 200);
        break;
      case 'thinking':
        this._tone(440, 0.1, 0.15);
        setTimeout(() => this._tone(550, 0.1, 0.15), 150);
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

  // 切换 SVG 动画
  setSVGState(state);

  // 状态变化音效
  if (state !== prevState) {
    if (state === 'thinking') sound.play('thinking');
    else if (state === 'error') sound.play('error');
    else if (state === 'happy') sound.play('happy');
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

  // 预加载所有 SVG
  await Promise.all([
    loadSVG('idle'),
    loadSVG('happy'),
    loadSVG('sleeping'),
    loadSVG('thinking'),
    loadSVG('working'),
    loadSVG('error')
  ]);

  // 设置初始状态
  await setSVGState('idle');

  initDrag();

  // 监听 Claude Code 状态变化
  if (window.electronAPI) {
    window.electronAPI.onStateChange((data) => {
      const { state, event, detail } = data;
      console.log(`[Desktop Cat] State: ${state} (event: ${event})`);

      // 根据状态设置持续时间
      let duration = null;
      if (state === 'happy') duration = 3000;
      else if (state === 'error') duration = 5000;

      setState(state, duration);

      // 显示状态气泡
      const msgs = STATE_MESSAGES[state];
      if (msgs) {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const detailText = detail ? ` (${detail})` : '';
        showBubble(msg + detailText, 2000);
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
