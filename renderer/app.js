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

// 互动系统 - 点击计数
let clickCount = 0;
let clickResetTimer = null;
let longPressTimer = null;
let isLongPress = false;

// 猫爪印系统
let lastPawTime = 0;
const PAW_INTERVAL = 300;
const PAW_LIFETIME = 3000;

// 互动累计
let totalPetCount = 0;

// 彩蛋系统
const EASTER_EGG_LOG = {};
let consecutiveSuccessCount = 0;

// 环境感知 - 空闲检测
let lastActivityTime = Date.now();
const IDLE_THRESHOLD = 5 * 60 * 1000;

// 时间感知
function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9)   return { period: 'morning',   msgs: ['早安喵~ ☀️', '新的一天开始啦~', '早安，今天也要加油！'] };
  if (hour >= 9 && hour < 12)  return { period: 'forenoon',  msgs: ['上午好！', '写代码的好时光~', '加油加油！'] };
  if (hour >= 12 && hour < 14) return { period: 'noon',      msgs: ['该吃饭了！🍱', '别忘了吃午饭哦~', '饿了喵...'] };
  if (hour >= 14 && hour < 18) return { period: 'afternoon', msgs: ['下午继续~', '喝杯咖啡？☕', '下午茶时间~'] };
  if (hour >= 18 && hour < 21) return { period: 'evening',   msgs: ['晚上好~🌅', '辛苦了一天啦', '晚饭吃啥？'] };
  if (hour >= 21 || hour < 1)  return { period: 'night',     msgs: ['夜深了...🌙', '早点休息哦~', '夜晚是灵感时间✨'] };
  return { period: 'late_night', msgs: ['还不睡觉！🦉', '熬夜会长黑眼圈的！', '喵...你不困我困了'] };
}

// 节日检测
function getHoliday() {
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  if (m === 1 && d === 1)   return { msg: '新年快乐！🎉🎊✨' };
  if (m === 2 && d === 14)  return { msg: '情人节快乐~ 💕🐱' };
  if (m === 10 && d >= 1 && d <= 7) return { msg: '国庆节快乐！🇨🇳🎉' };
  if (m === 12 && d === 25) return { msg: 'Merry Christmas! 🎄🎁' };
  if ((m === 1 && d >= 20) || (m === 2 && d <= 20)) return { msg: '新年快乐！恭喜发财~ 🧧🎆' };
  return null;
}

// 彩蛋防重复
function checkEasterEgg(id) {
  const today = new Date().toDateString();
  if (EASTER_EGG_LOG[id] === today) return false;
  EASTER_EGG_LOG[id] = today;
  return true;
}

// 空闲检测
function isUserIdle() {
  return Date.now() - lastActivityTime > IDLE_THRESHOLD;
}

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

// 清理乱码：移除控制字符和替换字符
function sanitizeText(text) {
  if (!text) return '';
  return String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g, '').trim();
}

// 状态对应的气泡消息
const STATE_MESSAGES = {
  idle:     ['...', '喵~', '😊', '🤔', '好无聊啊~', '你在干嘛？'],
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
    const img = document.createElement('img');
    img.src = url;
    img.alt = state;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border:none;outline:none;';
    svgWrapper.innerHTML = '';
    svgWrapper.appendChild(img);
    svgWrapper.className = `cat-svg-wrapper state-${state}`;
  }
}

// 带过渡动画的状态切换
function setThemeStateWithTransition(state) {
  svgWrapper.classList.add('transitioning');
  setTimeout(() => {
    setThemeState(state);
    svgWrapper.classList.remove('transitioning');
  }, 200);
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
// 成就系统初始化
// ============================================
async function initAchievements() {
  if (window.electronAPI) {
    const saved = await window.electronAPI.loadAchievements();
    if (saved) achievements.load(saved);
  }

  // 成就解锁监听
  achievements.on((type, data) => {
    if (type === 'achievement') {
      showBubble(`🏆 解锁成就：${data.icon} ${data.name}`, 4000);
      setState('happy', 4000);
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      particles.sparkle(rect.left - container.left + rect.width / 2, rect.top - container.top);
      if (data.reward) {
        setTimeout(() => {
          showBubble(`获得新装扮：${data.icon} ${data.name}！`, 3000);
        }, 4500);
      }
    }
    if (type === 'equip' || type === 'unequip') {
      renderAccessories();
    }
    saveAchievements();
  });

  // 每分钟保存一次
  setInterval(() => saveAchievements(), 60000);

  // 检查时间段成就
  achievements.recordTimeOfDay(new Date().getHours());
}

function saveAchievements() {
  if (window.electronAPI) {
    window.electronAPI.saveAchievements(achievements.toJSON());
  }
}

// 渲染配件
function renderAccessories() {
  const layer = document.getElementById('accessory-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const equipped = achievements.getEquipped();
  equipped.forEach(acc => {
    const el = document.createElement('div');
    el.className = `accessory slot-${acc.slot}`;
    el.textContent = acc.emoji;
    el.title = acc.name;
    layer.appendChild(el);
  });
}

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
  setThemeStateWithTransition(state);

  // 状态变化时的音效
  if (state !== prevState) {
    if (state === 'happy') sound.play('happy');
    else if (state === 'sleeping') sound.play('sleep');
  }

  // 彩蛋 E4：连续成功计数
  if (state === 'happy') {
    consecutiveSuccessCount++;
    if (consecutiveSuccessCount >= 10 && checkEasterEgg('streak10')) {
      showBubble('🎆 完美连击！连续 10 次成功！', 5000);
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      const cx = rect.left - container.left + rect.width / 2;
      const cy = rect.top - container.top;
      for (let i = 0; i < 12; i++) {
        setTimeout(() => particles.sparkle(cx, cy), i * 100);
      }
    }
  } else if (state === 'error') {
    consecutiveSuccessCount = 0;
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
function getClickZone(e) {
  const rect = cat.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;
  return relY < 0.5 ? 'head' : 'body';
}

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
function playAngry() {
  setState('error', 3000);
  sound.play('error');
  showBubble('哼！不理你了！😤', 3000);
  cat.classList.add('angry-shake');
  setTimeout(() => cat.classList.remove('angry-shake'), 600);
}

function createPawPrint(x, y) {
  const paw = document.createElement('div');
  paw.className = 'paw-print';
  paw.textContent = '🐾';
  paw.style.left = `${x}px`;
  paw.style.top = `${y}px`;
  paw.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg)`;
  document.getElementById('cat-container').appendChild(paw);
  setTimeout(() => paw.remove(), PAW_LIFETIME);
}

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

function playClick(zone) {
  cat.classList.add('click');
  setTimeout(() => cat.classList.remove('click'), 400);

  const rect = cat.getBoundingClientRect();
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const cx = rect.left - container.left + rect.width / 2;
  const cy = rect.top - container.top;

  if (zone === 'head') {
    // 头部：开心摸头
    particles.heart(cx, cy + 10);
    sound.play('click');
    totalPetCount++;
    achievements.recordPet();
    // 彩蛋 E7：摸头 100 次
    if (totalPetCount === 100 && checkEasterEgg('pet100')) {
      setTimeout(() => {
        showBubble('你真的好喜欢我呢~ 💕', 4000);
        particles.sparkle(cx, cy);
        setState('happy', 4000);
      }, 500);
    }
    const msgs = ['喵~ 🐱', '摸摸头~', '呼噜~', '蹭蹭~', '喜欢你！', '嘿嘿~'];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
  } else {
    // 身体：伸懒腰
    cat.classList.add('stretch');
    setTimeout(() => cat.classList.remove('stretch'), 600);
    particles.star(cx, cy);
    sound.play('meow');
    const msgs = ['伸懒腰~ 😸', '嗯~别碰肚子！', '嘻嘻~好痒'];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
  }
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
  await initAchievements();
  renderAccessories();

  // 监听 Claude Code 状态变化
  if (window.electronAPI) {
    window.electronAPI.onStateChange((data) => {
      const { state, event, detail, project } = data;
      console.log(`[Desktop Cat] State: ${state} (event: ${event}, project: ${project})`);

      // 记录通知历史
      addHistory(state, detail, project);

      // 记录成就进度
      if (state === 'happy') achievements.recordTask(false);
      else if (state === 'error') achievements.recordTask(true);

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
          if (detail) text += `: ${sanitizeText(detail)}`;
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
  cat.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isLongPress = false;
    // 记录按下时间（用于液体猫彩蛋检测）
    const pressStartTime = Date.now();
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      // 检查是否已按住 5 秒（液体猫彩蛋）
      const held = Date.now() - pressStartTime;
      if (held >= 5000 && checkEasterEgg('liquid')) {
        cat.classList.add('liquid-cat');
        sound.play('meow');
        showBubble('我是液体的... 🫠', 3000);
        setTimeout(() => cat.classList.remove('liquid-cat'), 3000);
      } else if (currentState !== 'sleeping') {
        setState('sleeping');
        sound.play('sleep');
        showBubble('呼噜... 💤');
      }
    }, 1500);
  });

  cat.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
  });

  cat.addEventListener('click', (e) => {
    if (isDragging || isLongPress) return;

    clickCount++;
    clearTimeout(clickResetTimer);
    clickResetTimer = setTimeout(() => { clickCount = 0; }, 5000);

    if (clickCount >= 7) {
      playAngry();
      clickCount = 0;
    } else if (clickCount >= 4) {
      showBubble('别摸了啦... >_<');
      sound.play('meow');
    } else {
      const zone = getClickZone(e);
      playClick(zone);
    }
  });

  // 双击切换睡眠
  cat.addEventListener('dblclick', (e) => {
    if (!isDragging && !isLongPress) {
      e.preventDefault();
      // 彩蛋 E2：10% 概率翻肚皮
      if (Math.random() < 0.10 && checkEasterEgg('belly')) {
        cat.classList.add('belly-flop');
        sound.play('happy');
        showBubble('给你看肚皮~ 🥰', 3000);
        achievements.recordEasterEgg('belly');
        const rect = cat.getBoundingClientRect();
        const container = document.getElementById('cat-container').getBoundingClientRect();
        const cx = rect.left - container.left + rect.width / 2;
        const cy = rect.top - container.top;
        for (let i = 0; i < 8; i++) {
          setTimeout(() => particles.sparkle(cx, cy), i * 150);
        }
        setTimeout(() => cat.classList.remove('belly-flop'), 2000);
      } else {
        toggleSleep();
      }
    }
  });

  // 悬停：禁用穿透 + 显示气泡
  cat.addEventListener('mouseenter', () => {
    disableClickThrough();
    if (!isDragging) {
      if (currentState !== 'sleeping') playHover();
    }
  });

  // 离开：恢复穿透
  cat.addEventListener('mouseleave', () => {
    stopHover();
    if (!isDragging) {
      enableClickThrough();
    }
  });

  // 猫爪印：在猫身上移动鼠标时生成
  cat.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastPawTime < PAW_INTERVAL) return;
    if (currentState === 'sleeping') return;
    lastPawTime = now;
    lastActivityTime = now;

    const container = document.getElementById('cat-container').getBoundingClientRect();
    const x = e.clientX - container.left + (Math.random() - 0.5) * 20;
    const y = e.clientY - container.top + (Math.random() - 0.5) * 20;
    createPawPrint(x, y);
  });

  // 右键切换音效
  cat.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const enabled = sound.toggle();
    showBubble(enabled ? '🔊 音效开' : '🔇 音效关', 1500);
  });

  // 彩蛋 E3：凌晨0点触发
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0 && checkEasterEgg('midnight')) {
    setTimeout(() => {
      showBubble('新的一天喵~ 🌙✨', 5000);
      setState('happy', 5000);
    }, 1000);
  }

  // 环境感知：节日彩蛋（启动 3 秒后）
  const holiday = getHoliday();
  if (holiday && checkEasterEgg('holiday')) {
    achievements.recordHoliday();
    setTimeout(() => {
      showBubble(holiday.msg, 5000);
      setState('happy', 5000);
    }, 3000);
  }

  // 随机动作（空闲时，DND 模式下跳过）
  setInterval(() => {
    if (dndMode) return;

    // 空闲检测：5 分钟无活动
    if (isUserIdle() && currentState === 'idle' && Math.random() < 0.3) {
      const idleActions = [
        () => { setState('sleeping', 8000); showBubble('好无聊...先睡一会~ 😴'); },
        () => { showBubble('你在吗？喵~ 🐱'); },
        () => { setState('thinking', 3000); showBubble('自己玩一会儿~ 🧶'); }
      ];
      idleActions[Math.floor(Math.random() * idleActions.length)]();
      return;
    }

    if (currentState === 'idle' && Math.random() < 0.25) {
      const rect = cat.getBoundingClientRect();
      const container = document.getElementById('cat-container').getBoundingClientRect();
      const cx = rect.left - container.left + rect.width / 2;
      const cy = rect.top - container.top;

      // 环境粒子：白天闪烁，夜晚星星
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18 && Math.random() < 0.3) {
        particles.sparkle(cx, cy);
      } else {
        particles.star(cx, cy);
      }

      // 时间感知的随机气泡
      const ctx = getTimeContext();
      const allMsgs = ['...', '喵~', '🤔', '😊', ...ctx.msgs];
      showBubble(allMsgs[Math.floor(Math.random() * allMsgs.length)], 1200);
    }
  }, 15000);

  // 应用退出前释放 Blob URL
  window.addEventListener('beforeunload', () => {
    revokeAllBlobURLs();
  });

  // 全局活动追踪（空闲检测）
  document.addEventListener('mousemove', () => { lastActivityTime = Date.now(); });
  document.addEventListener('keydown', () => { lastActivityTime = Date.now(); });

  console.log('[Desktop Cat] Initialized with 8 states + click-through + easter eggs + environment awareness');
});
