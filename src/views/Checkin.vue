<template>
  <div class="checkin page-container">
    <div class="date-header">
      <div class="date-info">
        <h2 class="today-date">{{ formatDate(today) }}</h2>
        <span class="weekday">{{ formatWeekday(today) }}</span>
      </div>
      <div class="date-nav">
        <el-button circle @click="prevDay" :icon="ArrowLeft" />
        <el-button type="primary" size="small" @click="selectToday">今天</el-button>
        <el-button circle @click="nextDay" :icon="ArrowRight" />
      </div>
    </div>

    <div class="checkin-stats card">
      <div class="stat-item">
        <div class="stat-number">{{ completedCount }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-number">{{ habits.value.length }}</div>
        <div class="stat-label">总习惯</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-number" :style="{ color: completionRateColor }">{{ completionRate }}%</div>
        <div class="stat-label">完成率</div>
      </div>
    </div>

    <div class="checkin-list">
      <div 
        class="checkin-item card" 
        v-for="habit in habits.value" 
        :key="habit.id"
        :class="{ 'checked': isHabitChecked(habit) }"
      >
        <div class="item-left">
          <div class="habit-icon" :style="{ backgroundColor: habit.color + '20' }">
            <el-icon :size="24" :color="habit.color">
              <component :is="getIconComponent(habit.icon)" />
            </el-icon>
          </div>
          <div class="habit-info">
            <h3 class="habit-name">{{ habit.name }}</h3>
            <div class="habit-meta">
              <el-tag size="small" :type="getCycleType(habit.cycle)" class="cycle-tag">
                {{ getCycleLabel(habit.cycle) }}
              </el-tag>
              <span class="target-text">
                目标: {{ habit.targetCount }} 次
              </span>
            </div>
          </div>
        </div>
        
        <div class="item-right">
          <div class="checkin-count" v-if="habit.targetCount > 1">
            <el-button 
              circle 
              size="small" 
              @click="decrementCount(habit)"
              :disabled="getCheckinCount(habit) <= 0"
            >
              <el-icon><Minus /></el-icon>
            </el-button>
            <span class="count-display">{{ getCheckinCount(habit) }} / {{ habit.targetCount }}</span>
            <el-button 
              circle 
              size="small" 
              type="primary"
              @click="incrementCount(habit)"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
          <div class="checkin-toggle" v-else>
            <el-switch
              v-model="checkedMap[habit.id]"
              active-color="#67c23a"
              @change="toggleCheckin(habit)"
            />
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="habits.value.length === 0">
        <el-empty description="暂无习惯，快去创建吧" :image-size="80">
          <el-button type="primary" @click="$router.push('/habits')">
            创建习惯
          </el-button>
        </el-empty>
      </div>
    </div>

    <div class="quick-actions" v-if="habits.value.length > 0">
      <el-button type="success" @click="checkAll" :disabled="completedCount === habits.value.length">
        <el-icon><CircleCheck /></el-icon>
        全部打卡
      </el-button>
      <el-button type="warning" @click="resetAll" :disabled="completedCount === 0">
        <el-icon><RefreshRight /></el-icon>
        重置打卡
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import dayjs from 'dayjs'
import { 
  ArrowLeft, ArrowRight, Plus, Minus, CircleCheck, RefreshRight,
  Calendar as CalendarIcon, List, Timer, Trophy, Sunny, Coffee, Moon,
  Running, Headset, Watermelon
} from '@element-plus/icons-vue'

const habitsStore = useHabitsStore()
const selectedDate = ref(dayjs())

const checkedMap = ref({})

const habits = computed(() => habitsStore.getActiveHabits())
const today = computed(() => selectedDate.value.format('YYYY-MM-DD'))

const completedCount = computed(() => {
  return habits.value.filter(h => isHabitChecked(h)).length
})

const completionRate = computed(() => {
  if (habits.value.length === 0) return 0
  return Math.round((completedCount.value / habits.value.length) * 100)
})

const completionRateColor = computed(() => {
  if (completionRate.value >= 80) return '#67c23a'
  if (completionRate.value >= 50) return '#e6a23c'
  return '#f56c6c'
})

watch(habits, () => {
  initCheckedMap()
}, { immediate: true, deep: true })

function initCheckedMap() {
  const map = {}
  habits.value.forEach(habit => {
    map[habit.id] = isHabitChecked(habit)
  })
  checkedMap.value = map
}

function formatDate(dateStr) {
  return dayjs(dateStr).format('YYYY年MM月DD日')
}

function formatWeekday(dateStr) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[dayjs(dateStr).day()]
}

function prevDay() {
  selectedDate.value = selectedDate.value.subtract(1, 'day')
  initCheckedMap()
}

function nextDay() {
  selectedDate.value = selectedDate.value.add(1, 'day')
  initCheckedMap()
}

function selectToday() {
  selectedDate.value = dayjs()
  initCheckedMap()
}

function getIconComponent(iconName) {
  const icons = {
    Calendar: CalendarIcon,
    List,
    Timer,
    Trophy,
    Sunny,
    Coffee,
    Moon,
    Running,
    Headset,
    Watermelon
  }
  return icons[iconName] || List
}

function getCycleLabel(cycle) {
  const labels = { daily: '每日', weekly: '每周', monthly: '每月' }
  return labels[cycle] || cycle
}

function getCycleType(cycle) {
  const types = { daily: 'primary', weekly: 'success', monthly: 'warning' }
  return types[cycle] || 'info'
}

function getCheckinCount(habit) {
  const checkin = habitsStore.getCheckinByDate(habit.id, today.value)
  return checkin ? checkin.count : 0
}

function isHabitChecked(habit) {
  const count = getCheckinCount(habit)
  return count >= habit.targetCount
}

function toggleCheckin(habit) {
  const isChecked = isHabitChecked(habit)
  if (isChecked) {
    habitsStore.uncheckin(habit.id, today.value)
  } else {
    habitsStore.checkin(habit.id, today.value, habit.targetCount)
  }
  checkedMap.value[habit.id] = !isChecked
}

function incrementCount(habit) {
  const currentCount = getCheckinCount(habit)
  if (currentCount < habit.targetCount) {
    habitsStore.checkin(habit.id, today.value, 1)
    initCheckedMap()
  }
}

function decrementCount(habit) {
  const currentCount = getCheckinCount(habit)
  if (currentCount > 0) {
    const checkin = habitsStore.getCheckinByDate(habit.id, today.value)
    if (checkin) {
      if (checkin.count <= 1) {
        habitsStore.uncheckin(habit.id, today.value)
      } else {
        habitsStore.checkin(habit.id, today.value, -1)
      }
      initCheckedMap()
    }
  }
}

function checkAll() {
  habits.value.forEach(habit => {
    if (!isHabitChecked(habit)) {
      habitsStore.checkin(habit.id, today.value, habit.targetCount)
    }
  })
  initCheckedMap()
}

function resetAll() {
  habits.value.forEach(habit => {
    if (isHabitChecked(habit)) {
      habitsStore.uncheckin(habit.id, today.value)
    }
  })
  initCheckedMap()
}
</script>

<style scoped>
.checkin {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.today-date {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.weekday {
  font-size: 14px;
  color: var(--text-secondary);
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkin-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 24px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: var(--border-color);
}

.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.checkin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  transition: all 0.3s ease;
}

.checkin-item.checked {
  border-left: 4px solid #67c23a;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.habit-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.habit-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.habit-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.habit-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cycle-tag {
  margin-right: 0;
}

.target-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.item-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.checkin-count {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-display {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  min-width: 60px;
  text-align: center;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 20px;
}

.quick-actions .el-button {
  padding: 12px 24px;
  font-weight: 500;
}
</style>