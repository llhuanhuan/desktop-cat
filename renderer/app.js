// ============================================
// Desktop Cat - SVG 猫咪交互控制器
// ============================================

let cat, bubble, bubbleText, svgWrapper;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let currentState = 'idle';
let stateTimer = null;
let imageCache = {};      // { state: { blob, url } }

// 免打扰模式
let dndMode = false;

// 通知历史（最近 50 条）
const MAX_HISTORY = 50;
const notificationHistory = [];

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
  happy: ['搞定啦！✨', '任务完成！🎉', '做好了！💖'],
  waking: ['喵~ 早安！☀️', '醒了~', '新的一天开始啦！'],
  sleeping: ['困了... 💤', '晚安~', 'zzZ...'],
  notification: ['有消息！📬', '叮咚~', '看看这个！']
};

// ============================================
// 通知历史管理
// ============================================
function addHistory(state, detail, project) {
  notificationHistory.unshift({
    state,
    detail: detail || '',
    project: project || '',
    time: new Date().toLocaleTimeString()
  });
  if (notificationHistory.length > MAX_HISTORY) {
    notificationHistory.pop();
  }
}

function getHistoryText() {
  if (notificationHistory.length === 0) return '暂无通知记录';
  return notificationHistory.slice(0, 10).map((h, i) => {
    const proj = h.project ? `[${h.project}] ` : '';
    return `${i + 1}. ${h.time} ${proj}${h.detail || h.state}`;
  }).join('\n');
}

// ============================================
// 主题加载器（带 Blob URL 缓存管理）
// ============================================
async function loadTheme(state) {
  if (imageCache[state]) return imageCache[state].url;

  try {
    const response = await fetch(THEME_MAP[state]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    imageCache[state] = { blob, url };
    return url;
  } catch (e) {
    console.error(`[Desktop Cat] Failed to load theme: ${state}`, e);
    return null;
  }
}

async function setThemeState(state) {
  const url = await loadTheme(state);
  if (url && svgWrapper) {
    svgWrapper.innerHTML = `<img src="${url}" alt="${state}" style="width:100%;height:100%;object-fit:contain;border:none;outline:none;">`;
  }
}

// 释放所有 Blob URL（应用退出前调用）
function revokeAllBlobURLs() {
  for (const state in imageCache) {
    if (imageCache[state].url) {
      URL.revokeObjectURL(imageCache[state].url);
    }
  }
  imageCache = {};
}

// ============================================
// 音效系统（统一使用 HTMLAudioElement，避免多 AudioContext 冲突）
// ============================================
const sound = {
  enabled: true,
  audioCache: {},

  init() {
    const files = {
      // 原有音效
      meow1: 'sounds/meow1.mp3',
      meow3: 'sounds/meow3.mp3',
      meow4: 'sounds/meow4.mp3',
      meow5: 'sounds/meow5.mp3',
      meow6: 'sounds/meow6.mp3',
      purr1: 'sounds/purr1.mp3',
      happy1: 'sounds/happy1.mp3',
      // 新增可爱变体 - 小猫版（高音调）
      kitten_meow1: 'sounds/kitten_meow1.mp3',
      kitten_meow2: 'sounds/kitten_meow2.mp3',
      kitten_meow3: 'sounds/kitten_meow3.mp3',
      // 新增可爱变体 - 大猫版（低音调）
      adult_meow1: 'sounds/adult_meow1.mp3',
      adult_meow2: 'sounds/adult_meow2.mp3',
      adult_meow3: 'sounds/adult_meow3.mp3',
      // 新增可爱变体 - 调皮版（快速短促）
      playful_meow1: 'sounds/playful_meow1.mp3',
      playful_meow2: 'sounds/playful_meow2.mp3',
      playful_meow3: 'sounds/playful_meow3.mp3',
      // 新增呼噜声变体
      soft_purr: 'sounds/soft_purr.mp3',
      happy_purr: 'sounds/happy_purr.mp3',
      // 新增开心音效变体
      excited_cat: 'sounds/excited_cat.mp3',
      gentle_happy: 'sounds/gentle_happy.mp3'
    };

    for (const [name, path] of Object.entries(files)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioCache[name] = audio;
    }
  },

  play(type) {
    if (!this.enabled) return;

    if (Object.keys(this.audioCache).length === 0) {
      this.init();
    }

    const soundMap = {
      'meow': ['meow1', 'meow3', 'meow4', 'meow5', 'meow6', 'kitten_meow1', 'kitten_meow2', 'kitten_meow3', 'adult_meow1', 'adult_meow2', 'playful_meow1', 'playful_meow2'],
      'click': ['purr1', 'soft_purr', 'happy_purr'],
      'happy': ['happy1', 'excited_cat', 'gentle_happy'],
      'error': ['meow3', 'adult_meow3'],
      'thinking': ['meow1', 'kitten_meow1', 'playful_meow1'],
      'sleep': ['purr1', 'soft_purr']
    };

    const sounds = soundMap[type] || ['meow1'];
    const soundName = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = this.audioCache[soundName];

    if (audio) {
      const clone = audio.cloneNode();
      clone.volume = 0.5;
      clone.play().catch(() => {});
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// 初始化音效
sound.init();

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
// 状态控制（带优先级保护）
// ============================================
const STATE_PRIORITY = {
  idle: 0,
  working: 1,
  thinking: 1,
  waking: 2,
  sleeping: 2,
  error: 3,
  happy: 4,
  notification: 4
};

let stateProtected = false;   // 高优先级状态保护中
let stateProtectTimer = null; // 保护计时器

function setState(state, duration) {
  // 高优先级状态保护：happy/notification 不被低优先级状态覆盖
  if (stateProtected && STATE_PRIORITY[state] < STATE_PRIORITY[currentState]) {
    return;
  }

  if (stateTimer) clearTimeout(stateTimer);
  if (stateProtectTimer) clearTimeout(stateProtectTimer);
  stateProtected = false;

  const prevState = currentState;
  currentState = state;

  // 切换主题动画
  setThemeState(state);

  // 状态变化时的音效
  if (state !== prevState) {
    if (state === 'happy') sound.play('happy');
    else if (state === 'sleeping') sound.play('sleep');
  }

  if (duration) {
    stateTimer = setTimeout(() => setState('idle'), duration);

    // 高优先级状态保护：防止被低优先级状态立即覆盖
    if (STATE_PRIORITY[state] >= 3) {
      stateProtected = true;
      stateProtectTimer = setTimeout(() => {
        stateProtected = false;
      }, Math.min(duration, 4000)); // 最多保护 4 秒
    }
  }
}

// ============================================
// 气泡 - 支持长消息显示
// ============================================
function showBubble(text, duration = 2000) {
  if (!bubble) return;

  const maxLength = 100;
  const isLong = text.length > maxLength;
  const displayText = isLong ? text.substring(0, maxLength) + '...' : text;

  bubbleText.textContent = displayText;

  if (isLong) {
    bubble.title = text;
    bubble.style.cursor = 'pointer';
    bubble.onclick = () => { alert(text); };
  } else {
    bubble.title = '';
    bubble.style.cursor = 'default';
    bubble.onclick = null;
  }

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
    disableClickThrough();
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

      // 记录通知历史
      addHistory(state, detail, project);

      // 根据状态设置持续时间
      let duration = null;
      if (state === 'happy') duration = 5000;
      else if (state === 'error') duration = 5000;
      else if (state === 'notification') duration = 4000;
      else if (state === 'waking') duration = 3000;

      setState(state, duration);

      // 免打扰模式下不显示气泡，但仍然切换动画
      if (!dndMode) {
        const msgs = STATE_MESSAGES[state];
        if (msgs) {
          const msg = msgs[Math.floor(Math.random() * msgs.length)];
          let text = '';
          if (project) text += `[${project}] `;
          text += msg;
          if (detail) text += `: ${detail}`;
          showBubble(text, state === 'happy' ? 5000 : 3000);
        }
      }

      // 特殊状态的音效（DND 模式下也播放，但音量降低）
      if (state === 'waking') sound.play('meow');
      else if (state === 'error') sound.play('error');
      else if (state === 'notification') sound.play('meow');
    });

    // 监听 DND 切换（来自主进程）
    window.electronAPI.onToggleDND((enabled) => {
      dndMode = enabled;
      showBubble(enabled ? '🌙 免打扰模式' : '🔔 正常模式', 1500);
    });

    // 监听显示历史请求
    window.electronAPI.onShowHistory(() => {
      const text = getHistoryText();
      showBubble('📋 最近通知', 5000);
      // 同时通过 IPC 返回历史数据
      if (window.electronAPI.sendHistory) {
        window.electronAPI.sendHistory(notificationHistory.slice(0, 10));
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

  // 随机动作（空闲时，DND 模式下跳过）
  setInterval(() => {
    if (dndMode) return;
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

  // 应用退出前释放 Blob URL
  window.addEventListener('beforeunload', () => {
    revokeAllBlobURLs();
  });

  console.log('[Desktop Cat] Initialized with 8 states + click-through');
});
