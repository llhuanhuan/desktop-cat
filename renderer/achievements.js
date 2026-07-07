// ============================================
// Desktop Cat - 成就系统
// ============================================

const ACHIEVEMENTS = {
  // 使用时长类
  first_day:    { name: '初来乍到',   desc: '第一次使用 Desktop Cat', icon: '🎉', reward: null },
  week_streak:  { name: '忠实伙伴',   desc: '连续使用 7 天',         icon: '💛', reward: 'scarf_red' },
  month_streak: { name: '铁杆猫奴',   desc: '连续使用 30 天',        icon: '👑', reward: 'crown' },

  // 代码成就类
  task_10:      { name: '小试牛刀',   desc: '完成 10 个任务',        icon: '⚡', reward: null },
  task_100:     { name: '百炼成钢',   desc: '完成 100 个任务',       icon: '🔥', reward: 'glasses' },
  task_500:     { name: '代码大师',   desc: '完成 500 个任务',       icon: '💎', reward: 'cape' },
  no_error_10:  { name: '完美主义者', desc: '连续 10 次任务无错误',   icon: '✨', reward: 'halo' },

  // 互动类
  pet_50:       { name: '猫咪挚友',   desc: '摸猫咪 50 次',          icon: '🤗', reward: 'bow_blue' },
  pet_100:      { name: '猫咪恋人',   desc: '摸猫咪 100 次',         icon: '💖', reward: 'hat_wizard' },
  pet_200:      { name: '猫咪灵魂伴侣', desc: '摸猫咪 200 次',       icon: '💕', reward: 'bell' },
  night_owl:    { name: '夜猫子',     desc: '凌晨 2 点还在写代码',    icon: '🦉', reward: 'coffee' },
  early_bird:   { name: '早起的鸟儿', desc: '早上 6 点就开始写代码',  icon: '🐦', reward: 'fish' },
  holiday:      { name: '节日精灵',   desc: '在节日期间使用',         icon: '🎊', reward: 'hat_wizard' },
};

const ACCESSORIES = {
  crown:      { name: '皇冠',     slot: 'head',  emoji: '👑' },
  halo:       { name: '光环',     slot: 'head',  emoji: '😇' },
  glasses:    { name: '墨镜',     slot: 'face',  emoji: '😎' },
  hat_wizard: { name: '巫师帽',   slot: 'head',  emoji: '🧙' },
  scarf_red:  { name: '红围巾',   slot: 'neck',  emoji: '🧣' },
  bow_blue:   { name: '蓝蝴蝶结', slot: 'neck',  emoji: '🎀' },
  bell:       { name: '铃铛',     slot: 'neck',  emoji: '🔔' },
  coffee:     { name: '咖啡杯',   slot: 'hand',  emoji: '☕' },
  fish:       { name: '小鱼干',   slot: 'hand',  emoji: '🐟' },
  cape:       { name: '披风',     slot: 'back',  emoji: '🦸' },
};

class AchievementSystem {
  constructor() {
    this.data = {
      unlocked: ['first_day'],
      progress: {
        task_count: 0,
        pet_count: 0,
        streak_days: 1,
        last_active_date: new Date().toDateString(),
        consecutive_no_error: 0,
      },
      accessories: {
        unlocked: [],
        equipped: {} // slot -> accessory id
      }
    };
    this._listeners = [];
  }

  // 加载持久化数据（含旧格式迁移）
  load(savedData) {
    if (!savedData) return;

    // 旧格式迁移（必须在合并前完成）
    if (savedData.equipped) {
      savedData.accessories = savedData.accessories || {};
      savedData.accessories.equipped = { ...savedData.equipped, ...(savedData.accessories.equipped || {}) };
      delete savedData.equipped;
    }

    this.data = {
      ...this.data,
      ...savedData,
      progress: { ...this.data.progress, ...(savedData.progress || {}) },
      accessories: { ...this.data.accessories, ...(savedData.accessories || {}) }
    };

    // 清理孤儿数据
    this.data.unlocked = this.data.unlocked.filter(id => ACHIEVEMENTS[id]);
    if (this.data.accessories) {
      this.data.accessories.unlocked = (this.data.accessories.unlocked || []).filter(id => ACCESSORIES[id]);
      for (const [slot, id] of Object.entries(this.data.accessories.equipped || {})) {
        if (!ACCESSORIES[id]) delete this.data.accessories.equipped[slot];
      }
    }

    this._checkStreak();
    this.check('first_day');
  }

  // 检查连续使用天数
  _checkStreak() {
    const today = new Date().toDateString();
    const last = this.data.progress.last_active_date;
    if (last !== today) {
      const lastDate = new Date(last);
      const todayDate = new Date(today);
      const diff = Math.floor((todayDate - lastDate) / 86400000);
      if (diff === 1) {
        this.data.progress.streak_days++;
      } else if (diff > 1) {
        this.data.progress.streak_days = 1;
      }
      this.data.progress.last_active_date = today;
    }
    // 检查连续天数成就
    if (this.data.progress.streak_days >= 7) this.check('week_streak');
    if (this.data.progress.streak_days >= 30) this.check('month_streak');
  }

  // 记录任务完成
  recordTask(hasError = false) {
    this.data.progress.task_count++;
    if (hasError) {
      this.data.progress.consecutive_no_error = 0;
    } else {
      this.data.progress.consecutive_no_error++;
    }

    // 检查任务数成就
    if (this.data.progress.task_count >= 10) this.check('task_10');
    if (this.data.progress.task_count >= 100) this.check('task_100');
    if (this.data.progress.task_count >= 500) this.check('task_500');

    // 检查无错误成就
    if (this.data.progress.consecutive_no_error >= 10) this.check('no_error_10');
  }

  // 记录摸头
  recordPet() {
    this.data.progress.pet_count++;
    if (this.data.progress.pet_count >= 50) this.check('pet_50');
    if (this.data.progress.pet_count >= 100) this.check('pet_100');
    if (this.data.progress.pet_count >= 200) this.check('pet_200');
  }

  // 记录彩蛋触发
  recordEasterEgg(id) {
    if (id === 'belly') this.check('pet_100'); // belly_rub 无对应成就，用 pet_100 替代
  }

  // 记录时间段使用
  recordTimeOfDay(hour) {
    if (hour >= 0 && hour < 2) this.check('night_owl');
    if (hour >= 6 && hour < 7) this.check('early_bird');
  }

  // 记录节日使用
  recordHoliday() {
    this.check('holiday');
  }

  // 检查并解锁成就
  check(id) {
    if (this.data.unlocked.includes(id)) return false;
    if (!ACHIEVEMENTS[id]) return false;

    this.data.unlocked.push(id);
    const achievement = ACHIEVEMENTS[id];

    // 解锁奖励配件
    if (achievement.reward && !this.data.accessories.unlocked.includes(achievement.reward)) {
      this.data.accessories.unlocked.push(achievement.reward);
    }

    // 通知监听器
    this._notify('achievement', { id, ...achievement });

    return true;
  }

  // 装备配件
  equip(accessoryId) {
    if (!this.data.accessories.unlocked.includes(accessoryId)) return false;
    const acc = ACCESSORIES[accessoryId];
    if (!acc) return false;
    this.data.accessories.equipped[acc.slot] = accessoryId;
    this._notify('equip', { id: accessoryId, ...acc });
    return true;
  }

  // 卸下配件
  unequip(slot) {
    delete this.data.accessories.equipped[slot];
    this._notify('unequip', { slot });
  }

  // 获取当前装备的配件列表
  getEquipped() {
    return Object.entries(this.data.accessories.equipped).map(([slot, id]) => ({
      slot,
      id,
      ...ACCESSORIES[id]
    }));
  }

  // 获取所有已解锁成就
  getUnlocked() {
    return this.data.unlocked.map(id => ({ id, ...ACHIEVEMENTS[id] }));
  }

  // 获取所有已解锁配件
  getUnlockedAccessories() {
    return this.data.accessories.unlocked.map(id => ({ id, ...ACCESSORIES[id] }));
  }

  // 注册监听器
  on(callback) {
    this._listeners.push(callback);
  }

  _notify(type, data) {
    this._listeners.forEach(fn => fn(type, data));
  }

  // 用于持久化的数据
  toJSON() {
    return this.data;
  }
}

// 全局实例
const achievements = new AchievementSystem();
