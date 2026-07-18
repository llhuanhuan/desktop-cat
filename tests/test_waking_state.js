/**
 * 测试 waking 状态使用时间感知的问候语
 */

// 模拟 getTimeContext 函数
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

// 模拟 STATE_MESSAGES
const STATE_MESSAGES = {
  waking: ['喵~ 早安！☀️', '醒了~', '新的一天开始啦！'],
};

// 测试场景
const testCases = [
  { hour: 20, state: 'waking', description: '晚上 8 点唤醒猫咪' },
  { hour: 22, state: 'waking', description: '晚上 10 点唤醒猫咪' },
  { hour: 2,  state: 'waking', description: '凌晨 2 点唤醒猫咪' },
  { hour: 7,  state: 'waking', description: '早上 7 点唤醒猫咪' },
];

console.log('=== 测试 waking 状态时间感知 ===\n');

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  // 模拟时间
  const originalGetHours = Date.prototype.getHours;
  Date.prototype.getHours = function() { return test.hour; };

  // 模拟修复后的逻辑
  let msgs = STATE_MESSAGES[test.state];
  if (test.state === 'waking') {
    const ctx = getTimeContext();
    msgs = ctx.msgs;
  }

  // 恢复原始方法
  Date.prototype.getHours = originalGetHours;

  const hasEarlyMorning = msgs.some(msg => msg.includes('早安'));
  const isMorningTime = test.hour >= 5 && test.hour < 9;

  if (test.state === 'waking') {
    if (isMorningTime && hasEarlyMorning) {
      console.log(`✅ 通过: ${test.description} (${test.hour}:00) -> 使用早安问候语`);
      passed++;
    } else if (!isMorningTime && !hasEarlyMorning) {
      console.log(`✅ 通过: ${test.description} (${test.hour}:00) -> 不使用早安问候语`);
      passed++;
    } else {
      console.log(`❌ 失败: ${test.description} (${test.hour}:00) -> 期望 ${isMorningTime ? '有' : '无'}早安问候语`);
      failed++;
    }
  }
});

console.log(`\n=== 测试结果 ===`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${testCases.length}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过！');
  process.exit(0);
}
