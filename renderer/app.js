// 猫咪状态管理
let cat, notification, notificationText;

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

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
function showNotification(message) {
  if (!notificationText || !notification) {
    console.error('[Desktop Cat] Notification elements not found');
    return;
  }
  notificationText.textContent = message;
  notification.classList.remove('hidden');
  notification.classList.add('show');

  // 3秒后隐藏
  setTimeout(() => {
    notification.classList.remove('show');
    notification.classList.add('hidden');
  }, 3000);
}

// 播放开心动画
function playHappyAnimation() {
  if (!cat) return;
  cat.classList.remove('idle');
  cat.classList.add('happy');

  // 显示通知
  showNotification('✅ 任务完成啦！');

  // 1秒后恢复空闲状态
  setTimeout(() => {
    cat.classList.remove('happy');
    cat.classList.add('idle');
  }, 1000);
}

// 播放猫叫声（可选）
function playMeow() {
  // 如果有音效文件，可以在这里播放
  // const audio = new Audio('assets/sounds/meow.mp3');
  // audio.play().catch(e => console.log('Audio play failed:', e));
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 获取 DOM 元素
  cat = document.getElementById('cat');
  notification = document.getElementById('notification');
  notificationText = notification.querySelector('.notification-text');

  initDrag();

  // 监听任务完成事件
  if (window.electronAPI) {
    window.electronAPI.onTaskDone((message) => {
      console.log('[Desktop Cat] Task done:', message);
      playHappyAnimation();
      playMeow();
    });
  }

  // 点击猫咪
  cat.addEventListener('click', () => {
    if (!isDragging) {
      playHappyAnimation();
      showNotification('喵~ 🐱');
    }
  });

  console.log('[Desktop Cat] Initialized');
});
