// ============================================
// Desktop Cat - 成就与外观系统
// ============================================

const ACHIEVEMENTS = {
  // 使用时长类
  first_day:    { name: '初来乍到',     desc: '第一次使用 Desktop Cat',  icon: '🎉', reward: null },
  week_streak:  { name: '忠实伙伴',     desc: '连续使用 7 天',          icon: '💛', reward: 'scarf_red' },
  month_streak: { name: '铁杆猫奴',     desc: '连续使用 30 天',         icon: '👑', reward: 'crown' },

  // 代码成就类
  task_10:      { name: '小试牛刀',     desc: '完成 10 个任务',         icon: '⚡', reward: null },
  task_100:     { name: '百炼成钢',     desc: '完成 100 个任务',        icon: '🔥', reward: 'glasses' },
  task_500:     { name: '代码大师',     desc: '完成 500 个任务',        icon: '💎', reward: 'cape' },
  no_error_10:  { name: '完美主义者',   desc: '连续 10 次任务无错误',    icon: '✨', reward: 'halo' },

  // 互动类
  pet_50:       { name: '猫咪挚友',     desc: '摸猫咪 50 次',           icon: '🤗', reward: 'bow_blue' },
  night_owl:    { name: '夜猫子',       desc: '凌晨 2 点还在写代码',     icon: '🦉', reward: 'coffee' },
  early_bird:   { name: '早起的鸟儿',   desc: '早上 6 点就开始写代码',   icon: '🐦', reward: null },
  pet_100:      { name: '猫咪恋人',     desc: '摸猫咪 100 次',          icon: '💕', reward: 'bell' },
  belly_rub:    { name: '肚皮猎人',     desc: '触发翻肚皮彩蛋',         icon: '🐱', reward: 'hat_wizard' },
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
    this.unlocked = new Set();
    this.progress = {
      task_count: 0,
      pet_count: 0,
      streak_days: 0,
      last_active_date: null,
      consecutive_no_error: 0,
    };
    this.equipped = {}; // slot -> accessory id
    this.onUnlock = null; // callback: (achievement) => void
    this.onAccessoryChange = null; // callback: () => void
  }

  // 加载持久化数据
  load(data) {
    if (!data) return;
    if (data.unlocked) this.unlocked = new Set(data.unlocked);
    if (data.progress) this.progress = { ...this.progress, ...data.progress };
    if (data.equipped) this.equipped = { ...data.equipped };
  }

  // 序列化
  save() {
    return {
      unlocked: Array.from(this.unlocked),
      progress: this.progress,
      equipped: this.equipped,
    };
  }

  // 记录任务完成
  recordTask(success = true) {
    this.progress.task_count++;
    this._updateStreak();

    if (success) {
      this.progress.consecutive_no_error++;
    } else {
      this.progress.consecutive_no_error = 0;
    }

    this._checkAchievements();
    return this.save();
  }

  // 记录摸头
  recordPet() {
    this.progress.pet_count++;
    this._updateStreak();
    this._checkAchievements();
    return this.save();
  }

  // 记录彩蛋触发
  recordEasterEgg(id) {
    if (id === 'belly') {
      this._tryUnlock('belly_rub');
    }
    return this.save();
  }

  // 检查时间类成就
  checkTimeAchievements() {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 0 && hour < 2) this._tryUnlock('night_owl');
    if (hour >= 6 && hour < 7) this._tryUnlock('early_bird');
    this._tryUnlock('first_day');
  }

  // 装备配件
  equip(accessoryId) {
    const acc = ACCESSORIES[accessoryId];
    if (!acc || !this.unlocked.has(accessoryId)) return false;
    this.equipped[acc.slot] = accessoryId;
    if (this.onAccessoryChange) this.onAccessoryChange();
    return this.save();
  }

  // 卸下配件
  unequip(slot) {
    delete this.equipped[slot];
    if (this.onAccessoryChange) this.onAccessoryChange();
    return this.save();
  }

  // 获取装备的配件列表
  getEquippedAccessories() {
    return Object.entries(this.equipped).map(([slot, id]) => ({
      id,
      slot,
      ...ACCESSORIES[id],
    }));
  }

  // 获取已解锁的配件列表
  getUnlockedAccessories() {
    return Array.from(this.unlocked)
      .filter(id => ACCESSORIES[id])
      .map(id => ({ id, ...ACCESSORIES[id] }));
  }

  // 私有方法
  _updateStreak() {
    const today = new Date().toDateString();
    if (this.progress.last_active_date === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (this.progress.last_active_date === yesterday.toDateString()) {
      this.progress.streak_days++;
    } else {
      this.progress.streak_days = 1;
    }
    this.progress.last_active_date = today;
  }

  _checkAchievements() {
    const p = this.progress;

    // 任务数
    if (p.task_count >= 10) this._tryUnlock('task_10');
    if (p.task_count >= 100) this._tryUnlock('task_100');
    if (p.task_count >= 500) this._tryUnlock('task_500');

    // 连续无错
    if (p.consecutive_no_error >= 10) this._tryUnlock('no_error_10');

    // 摸头数
    if (p.pet_count >= 50) this._tryUnlock('pet_50');
    if (p.pet_count >= 100) this._tryUnlock('pet_100');

    // 连续使用
    if (p.streak_days >= 7) this._tryUnlock('week_streak');
    if (p.streak_days >= 30) this._tryUnlock('month_streak');

    // 时间
    this.checkTimeAchievements();
  }

  _tryUnlock(id) {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    const achievement = ACHIEVEMENTS[id];
    // 先装备奖励配件，再触发回调（回调会保存数据）
    if (achievement && achievement.reward && ACCESSORIES[achievement.reward]) {
      this.equipped[ACCESSORIES[achievement.reward].slot] = achievement.reward;
      if (this.onAccessoryChange) this.onAccessoryChange();
    }
    if (achievement && this.onUnlock) {
      this.onUnlock(achievement);
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AchievementSystem, ACHIEVEMENTS, ACCESSORIES };
}
