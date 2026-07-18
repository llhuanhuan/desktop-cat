/**
 * 测试 getTimeContext() 函数的时间感知逻辑
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

// 测试用例
const tests = [
  { hour: 5,  expected: 'morning' },
  { hour: 6,  expected: 'morning' },
  { hour: 8,  expected: 'morning' },
  { hour: 9,  expected: 'forenoon' },
  { hour: 10, expected: 'forenoon' },
  { hour: 11, expected: 'forenoon' },
  { hour: 12, expected: 'noon' },
  { hour: 13, expected: 'noon' },
  { hour: 14, expected: 'afternoon' },
  { hour: 15, expected: 'afternoon' },
  { hour: 17, expected: 'afternoon' },
  { hour: 18, expected: 'evening' },
  { hour: 19, expected: 'evening' },
  { hour: 20, expected: 'evening' },
  { hour: 21, expected: 'night' },
  { hour: 22, expected: 'night' },
  { hour: 23, expected: 'night' },
  { hour: 0,  expected: 'night' },
  { hour: 1,  expected: 'late_night' },
  { hour: 2,  expected: 'late_night' },
  { hour: 3,  expected: 'late_night' },
  { hour: 4,  expected: 'late_night' },
];

// 运行测试
console.log('=== 测试 getTimeContext() 函数 ===\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  // 模拟时间
  const originalGetHours = Date.prototype.getHours;
  Date.prototype.getHours = function() { return test.hour; };

  const result = getTimeContext();

  // 恢复原始方法
  Date.prototype.getHours = originalGetHours;

  if (result.period === test.expected) {
    console.log(`✅ 通过: ${test.hour}:00 -> ${result.period}`);
    passed++;
  } else {
    console.log(`❌ 失败: ${test.hour}:00 -> 期望 ${test.expected}, 实际 ${result.period}`);
    failed++;
  }
});

console.log(`\n=== 测试结果 ===`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${tests.length}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过！');
  process.exit(0);
}
