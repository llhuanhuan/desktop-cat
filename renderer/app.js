// 猫咪状态管理
let cat, notification, notificationText;
let catBody, catHead, catTail;

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 音效管理器
const soundManager = {
  sounds: {},
  enabled: true,
  useGeneratedSounds: true, // 使用生成的音效作为备选

  // 预加载音效
  preload(name, path) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.5;

      // 检查是否能加载
      audio.addEventListener('canplaythrough', () => {
        this.sounds[name] = audio;
        this.useGeneratedSounds = false;
        console.log(`[Sound] Loaded: ${name}`);
      });

      audio.addEventListener('error', () => {
        console.log(`[Sound] External sound not found: ${name}, using generated sounds`);
      });

      audio.load();
    } catch (e) {
      console.warn(`[Sound] Failed to load ${name}:`, e);
    }
  },

  // 播放音效
  play(name) {
    if (!this.enabled) return;

    // 优先使用外部音效文件
    if (this.sounds[name]) {
      try {
        const audio = this.sounds[name].cloneNode();
        audio.currentTime = 0;
        audio.play().catch(e => console.log('[Sound] Play failed:', e));
        return;
      } catch (e) {
        console.warn('[Sound] External play error:', e);
      }
    }

    // 使用生成的音效
    if (this.useGeneratedSounds && window.soundGenerator) {
      switch (name) {
        case 'meow':
          window.soundGenerator.generateMeow();
          break;
        case 'click':
          window.soundGenerator.generateClick();
          break;
        case 'success':
          window.soundGenerator.generateSuccess();
          break;
      }
    }
  },

  // 切换音效开关
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// 粒子效果系统
const particleSystem = {
  particles: [],

  // 创建爱心粒子
  createHeart(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle heart';
    particle.innerHTML = '❤️';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.getElementById('cat-container').appendChild(particle);

    // 动画结束后移除
    setTimeout(() => particle.remove(), 1000);
  },

  // 创建星星粒子
  createStar(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle star';
    particle.innerHTML = '⭐';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.getElementById('cat-container').appendChild(particle);

    setTimeout(() => particle.remove(), 800);
  },

  // 创建烟花效果
  createFirework(x, y) {
    const emojis = ['✨', '🌟', '💫', '🎉'];
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle firework';
        particle.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = `${x + (Math.random() - 0.5) * 60}px`;
        particle.style.top = `${y + (Math.random() - 0.5) * 60}px`;
        document.getElementById('cat-container').appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
      }, i * 50);
    }
  }
};

// 初始化拖拽功能
function initDrag() {
  const container = document.getElementById('cat-container');

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
    container.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragOffsetX;
    const dy = e.clientY - dragOffsetY;

    // 通过 IPC 移动窗口
    if (window.electronAPI) {
      window.electronAPI.moveWindow(dx, dy);
    }

    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.getElementById('cat-container').style.cursor = 'grab';
  });
}

// 显示通知
function showNotification(message, type = 'success') {
  if (!notificationText || !notification) {
    console.error('[Desktop Cat] Notification elements not found');
    return;
  }

  notificationText.textContent = message;
  notification.className = `notification ${type}`;

  // 触发动画
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // 3秒后隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    notification.classList.add('hidden');
  }, 3000);
}

// 播放任务完成动画（增强版）
function playTaskDoneAnimation() {
  if (!cat) return;

  // 移除空闲状态
  cat.classList.remove('idle');
  cat.classList.add('happy');

  // 播放成功音效
  soundManager.play('success');

  // 延迟播放猫叫声
  setTimeout(() => {
    soundManager.play('meow');
  }, 300);

  // 创建烟花效果
  const rect = cat.getBoundingClientRect();
  particleSystem.createFirework(rect.width / 2, 20);

  // 显示通知
  showNotification('✅ 任务完成啦！', 'success');

  // 1.5秒后恢复空闲状态
  setTimeout(() => {
    cat.classList.remove('happy');
    cat.classList.add('idle');
  }, 1500);
}

// 播放点击动画
function playClickAnimation() {
  if (!cat) return;

  cat.classList.remove('idle');
  cat.classList.add('click');

  // 播放点击音效
  soundManager.play('click');

  // 创建爱心粒子
  const rect = cat.getBoundingClientRect();
  particleSystem.createHeart(rect.width / 2, 30);

  // 显示随机猫咪语录
  const phrases = ['喵~ 🐱', '摸摸头~', '呼噜呼噜~', '蹭蹭~', '开心！'];
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  showNotification(randomPhrase, 'info');

  setTimeout(() => {
    cat.classList.remove('click');
    cat.classList.add('idle');
  }, 500);
}

// 播放悬停动画
function playHoverAnimation() {
  if (!cat) return;
  cat.classList.add('hover');
}

function stopHoverAnimation() {
  if (!cat) return;
  cat.classList.remove('hover');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 获取 DOM 元素
  cat = document.getElementById('cat');
  catBody = cat.querySelector('.cat-body');
  catHead = cat.querySelector('.cat-head');
  catTail = cat.querySelector('.cat-tail');
  notification = document.getElementById('notification');
  notificationText = notification.querySelector('.notification-text');

  // 预加载音效
  soundManager.preload('meow', 'sounds/meow.mp3');
  soundManager.preload('click', 'sounds/click.mp3');

  initDrag();

  // 监听任务完成事件
  if (window.electronAPI) {
    window.electronAPI.onTaskDone((message) => {
      console.log('[Desktop Cat] Task done:', message);
      playTaskDoneAnimation();
    });
  }

  // 点击猫咪
  cat.addEventListener('click', (e) => {
    if (!isDragging) {
      playClickAnimation();
    }
  });

  // 悬停效果
  cat.addEventListener('mouseenter', () => {
    if (!isDragging) {
      playHoverAnimation();
    }
  });

  cat.addEventListener('mouseleave', () => {
    stopHoverAnimation();
  });

  // 右键菜单 - 切换音效
  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = soundManager.toggle();
    showNotification(enabled ? '🔊 音效已开启' : '🔇 音效已关闭', 'info');
  });

  console.log('[Desktop Cat] Initialized');
});
