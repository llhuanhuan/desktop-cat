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
    svgWrapper.innerHTML = `<img src="${url}" alt="${state}" style="width:100%;height:100%;object-fit:contain;border:none;outline:none;">`;
  }
}

// ============================================
// 音效 - 猫咪主题音效系统（使用真实音效文件）
// ============================================
const sound = {
  enabled: true,
  audioCache: {},

  init() {
    // 预加载音效文件
    const files = {
      meow1: 'sounds/meow1.mp3',
      meow3: 'sounds/meow3.mp3',
      meow4: 'sounds/meow4.mp3',
      meow5: 'sounds/meow5.mp3',
      meow6: 'sounds/meow6.mp3',
      purr1: 'sounds/purr1.mp3',
      happy1: 'sounds/happy1.mp3'
    };

    for (const [name, path] of Object.entries(files)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioCache[name] = audio;
    }
  },

  play(type) {
    if (!this.enabled) return;

    // 确保初始化
    if (Object.keys(this.audioCache).length === 0) {
      this.init();
    }

    // 音效映射
    const soundMap = {
      'meow': ['meow1', 'meow3', 'meow4', 'meow5', 'meow6'],  // 随机选择一个猫叫
      'click': ['purr1'],                                       // 呼噜声
      'happy': ['happy1'],                                      // 开心
      'error': ['meow3'],                                       // 不满
      'thinking': ['meow1'],                                    // 轻柔的猫叫
      'sleep': ['purr1']                                        // 呼噜声
    };

    const sounds = soundMap[type] || ['meow1'];
    const soundName = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = this.audioCache[soundName];

    if (audio) {
      // 克隆音频以支持重叠播放
      const clone = audio.cloneNode();
      clone.volume = 0.5;
      clone.play().catch(e => console.log('音效播放失败:', e));
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
// 状态控制
// ============================================
function setState(state, duration) {
  if (stateTimer) clearTimeout(stateTimer);
  const prevState = currentState;
  currentState = state;

  // 切换主题动画
  setThemeState(state);

  // 只在任务完成时播放音效
  if (state !== prevState && state === 'happy') {
    sound.play('happy');
  }

  if (duration) {
    stateTimer = setTimeout(() => setState('idle'), duration);
  }
}

// ============================================
// 气泡 - 支持长消息显示
// ============================================
function showBubble(text, duration = 2000) {
  if (!bubble) return;

  // 截断长消息，保留完整信息
  const maxLength = 100;
  const isLong = text.length > maxLength;
  const displayText = isLong ? text.substring(0, maxLength) + '...' : text;

  bubbleText.textContent = displayText;

  // 如果是长消息，添加 title 属性用于悬停显示完整内容
  if (isLong) {
    bubble.title = text;
    bubble.style.cursor = 'pointer';

    // 点击气泡显示完整消息
    bubble.onclick = () => {
      alert(text);
    };
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

      // 根据状态设置持续时间
      let duration = null;
      if (state === 'happy') duration = 3000;
      else if (state === 'error') duration = 5000;

      setState(state, duration);

      // 显示状态气泡（带项目名和详情）
      const msgs = STATE_MESSAGES[state];
      if (msgs) {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        let bubbleText = '';
        if (project) bubbleText += `[${project}] `;
        bubbleText += msg;
        if (detail) bubbleText += `: ${detail}`;
        showBubble(bubbleText, 3000);
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
