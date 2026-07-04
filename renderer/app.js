// ============================================
// Desktop Cat - 交互控制器
// ============================================

// 状态管理
let cat, catHead, catTail, catBody;
let bubble, bubbleText, notification, notificationText;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentState = 'idle';
let stateTimeout = null;

// ============================================
// 音效管理器
// ============================================
const soundManager = {
  sounds: {},
  enabled: true,
  useGeneratedSounds: true,

  preload(name, path) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.5;

      audio.addEventListener('canplaythrough', () => {
        this.sounds[name] = audio;
        this.useGeneratedSounds = false;
        console.log(`[Sound] Loaded: ${name}`);
      });

      audio.addEventListener('error', () => {
        console.log(`[Sound] Using generated sound: ${name}`);
      });

      audio.load();
    } catch (e) {
      console.warn(`[Sound] Failed to load ${name}:`, e);
    }
  },

  play(name) {
    if (!this.enabled) return;

    if (this.sounds[name]) {
      try {
        const audio = this.sounds[name].cloneNode();
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      } catch (e) {}
    }

    if (this.useGeneratedSounds && window.soundGenerator) {
      switch (name) {
        case 'meow': window.soundGenerator.generateMeow(); break;
        case 'click': window.soundGenerator.generateClick(); break;
        case 'success': window.soundGenerator.generateSuccess(); break;
      }
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// ============================================
// 粒子系统
// ============================================
const particleSystem = {
  createHeart(x, y) {
    const emojis = ['❤️', '💕', '💖', '💗'];
    this._createParticle(x, y, emojis[Math.floor(Math.random() * emojis.length)], 'heart');
  },

  createStar(x, y) {
    this._createParticle(x, y, '⭐', 'star');
  },

  createFirework(x, y) {
    const emojis = ['✨', '🌟', '💫', '🎉', '🎊'];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 40;
        this._createParticle(
          x + offsetX,
          y + offsetY,
          emojis[Math.floor(Math.random() * emojis.length)],
          'firework'
        );
      }, i * 60);
    }
  },

  createConfetti(x, y) {
    const colors = ['🎉', '🎊', '🎀', '🎈', '💐'];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * 100;
        this._createParticle(
          x + offsetX,
          y - 20,
          colors[Math.floor(Math.random() * colors.length)],
          'confetti'
        );
      }, i * 80);
    }
  },

  _createParticle(x, y, content, className) {
    const particle = document.createElement('div');
    particle.className = `particle ${className}`;
    particle.textContent = content;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.getElementById('cat-container').appendChild(particle);

    const duration = className === 'confetti' ? 1500 : 1000;
    setTimeout(() => particle.remove(), duration);
  }
};

// ============================================
// 状态管理
// ============================================
function setState(newState, duration = null) {
  if (stateTimeout) {
    clearTimeout(stateTimeout);
    stateTimeout = null;
  }

  cat.classList.remove(currentState);
  currentState = newState;
  cat.classList.add(newState);

  if (duration) {
    stateTimeout = setTimeout(() => {
      setState('idle');
    }, duration);
  }
}

// ============================================
// 拖拽功能
// ============================================
function initDrag() {
  const container = document.getElementById('cat-container');

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragOffsetX;
    const dy = e.clientY - dragOffsetY;

    if (window.electronAPI) {
      window.electronAPI.moveWindow(dx, dy);
    }

    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.getElementById('cat-container').style.cursor = 'grab';
    }
  });
}

// ============================================
// 气泡消息
// ============================================
function showBubble(message, duration = 2000) {
  if (!bubble || !bubbleText) return;

  bubbleText.textContent = message;
  bubble.className = 'bubble show';

  setTimeout(() => {
    bubble.className = 'bubble hidden';
  }, duration);
}

// ============================================
// 通知
// ============================================
function showNotification(message, type = 'success', icon = '') {
  if (!notification || !notificationText) return;

  const iconEl = notification.querySelector('.notification-icon');
  if (iconEl) {
    iconEl.textContent = icon || (type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '⚠️');
  }

  notificationText.textContent = message;
  notification.className = `notification ${type}`;

  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  setTimeout(() => {
    notification.classList.remove('show');
    notification.classList.add('hidden');
  }, 3000);
}

// ============================================
// 动画效果
// ============================================

// 任务完成动画
function playTaskDoneAnimation() {
  setState('happy', 1800);

  // 音效
  soundManager.play('success');
  setTimeout(() => soundManager.play('meow'), 300);

  // 粒子效果
  const rect = cat.getBoundingClientRect();
  const containerRect = document.getElementById('cat-container').getBoundingClientRect();
  const centerX = rect.left - containerRect.left + rect.width / 2;
  const topY = rect.top - containerRect.top;

  particleSystem.createFirework(centerX, topY);
  setTimeout(() => particleSystem.createConfetti(centerX, topY + 50), 200);

  // 气泡
  showBubble('任务完成啦！🎉', 2500);

  // 通知
  showNotification('任务完成！', 'success', '🎉');
}

// 点击动画
function playClickAnimation() {
  setState('click', 500);

  soundManager.play('click');

  // 爱心粒子
  const rect = cat.getBoundingClientRect();
  const containerRect = document.getElementById('cat-container').getBoundingClientRect();
  particleSystem.createHeart(
    rect.left - containerRect.left + rect.width / 2,
    rect.top - containerRect.top + 10
  );

  // 随机语录
  const phrases = [
    '喵~ 🐱', '摸摸头~', '呼噜呼噜~', '蹭蹭~',
    '开心！', '再摸摸~', '喵呜~', '喜欢你！',
    '嘿嘿~', '好舒服~'
  ];
  showBubble(phrases[Math.floor(Math.random() * phrases.length)]);
}

// 悬停效果
function playHoverAnimation() {
  cat.classList.add('hover');
  showBubble('喵？', 1000);
}

function stopHoverAnimation() {
  cat.classList.remove('hover');
}

// 睡眠切换
function toggleSleep() {
  if (currentState === 'sleeping') {
    setState('idle');
    showBubble('伸个懒腰~ 😴', 1500);
  } else {
    setState('sleeping');
    showBubble('困了... 💤', 2000);
  }
}

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // 获取元素
  cat = document.getElementById('cat');
  catHead = cat.querySelector('.head');
  catBody = cat.querySelector('.body');
  catTail = cat.querySelector('.tail');
  bubble = document.getElementById('bubble');
  bubbleText = bubble.querySelector('.bubble-text');
  notification = document.getElementById('notification');
  notificationText = notification.querySelector('.notification-text');

  // 预加载音效
  soundManager.preload('meow', 'sounds/meow.mp3');
  soundManager.preload('click', 'sounds/click.mp3');
  soundManager.preload('success', 'sounds/success.mp3');

  // 初始化拖拽
  initDrag();

  // 监听任务完成事件
  if (window.electronAPI) {
    window.electronAPI.onTaskDone((message) => {
      console.log('[Desktop Cat] Task done:', message);
      playTaskDoneAnimation();
    });
  }

  // 点击事件
  cat.addEventListener('click', (e) => {
    if (!isDragging) {
      playClickAnimation();
    }
  });

  // 双击睡眠
  cat.addEventListener('dblclick', (e) => {
    if (!isDragging) {
      e.preventDefault();
      toggleSleep();
    }
  });

  // 悬停效果
  cat.addEventListener('mouseenter', () => {
    if (!isDragging && currentState !== 'sleeping') {
      playHoverAnimation();
    }
  });

  cat.addEventListener('mouseleave', () => {
    stopHoverAnimation();
  });

  // 右键切换音效
  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = soundManager.toggle();
    showBubble(enabled ? '🔊 音效开启' : '🔇 音效关闭', 1500);
  });

  // 随机动作
  setInterval(() => {
    if (currentState === 'idle' && Math.random() < 0.3) {
      const actions = [
        () => showBubble('喵~', 1500),
        () => showBubble('...', 1000),
        () => {
          const rect = cat.getBoundingClientRect();
          const containerRect = document.getElementById('cat-container').getBoundingClientRect();
          particleSystem.createStar(
            rect.left - containerRect.left + rect.width / 2,
            rect.top - containerRect.top
          );
        }
      ];
      actions[Math.floor(Math.random() * actions.length)]();
    }
  }, 10000);

  console.log('[Desktop Cat] Initialized');
});
