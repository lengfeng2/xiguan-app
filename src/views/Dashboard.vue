<template>
  <div class="dashboard page-container">
    <div class="stats-row">
      <div class="stat-card card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '20' }">
          <el-icon :size="24" :color="stat.color">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.title }}</div>
        </div>
      </div>
    </div>

    <div class="content-row">
      <div class="today-card card flex-1">
        <div class="card-header">
          <h3 class="card-title">今日待打卡</h3>
          <el-button type="primary" size="small" @click="$router.push('/checkin')">
            去打卡
          </el-button>
        </div>
        <div class="habits-list" v-if="todayHabits.length > 0">
          <div 
            class="habit-item" 
            v-for="habit in todayHabits" 
            :key="habit.id"
            @click="toggleCheckin(habit)"
          >
            <div class="habit-icon" :style="{ backgroundColor: habit.color + '20' }">
              <el-icon :size="20" :color="habit.color">
                <component :is="getIconComponent(habit.icon)" />
              </el-icon>
            </div>
            <div class="habit-info">
              <div class="habit-name">{{ habit.name }}</div>
              <div class="habit-progress">
                {{ getTodayCount(habit.id) }} / {{ habit.targetCount }} 次
              </div>
            </div>
            <div class="habit-status">
              <el-checkbox 
                :model-value="isChecked(habit.id)" 
                @click.stop
              />
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <el-empty description="暂无习惯，快去创建吧" :image-size="60">
            <el-button type="primary" size="small" @click="$router.push('/habits')">
              创建习惯
            </el-button>
          </el-empty>
        </div>
      </div>

      <div class="completion-card card">
        <div class="card-header">
          <h3 class="card-title">本周完成率</h3>
        </div>
        <div class="completion-content">
          <el-progress 
            type="dashboard" 
            :percentage="weekCompletionRate" 
            :color="progressColor"
          >
            <span class="percentage">{{ weekCompletionRate }}%</span>
          </el-progress>
        </div>
      </div>
    </div>

    <div class="calendar-card card">
      <div class="card-header">
        <h3 class="card-title">打卡日历</h3>
      </div>
      <el-calendar v-model="selectedDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell">
            <div class="day-number">{{ data.day }}</div>
            <div class="day-indicators">
              <div 
                class="indicator" 
                v-for="habit in getHabitsForDate(data)" 
                :key="habit.id"
                :style="{ backgroundColor: habit.color }"
              />
            </div>
          </div>
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import dayjs from 'dayjs'
import { 
  List, CircleCheck, DataAnalysis, Calendar as CalendarIcon, 
  Trophy, Timer, Sunny
} from '@element-plus/icons-vue'

const habitsStore = useHabitsStore()
const selectedDate = ref(new Date())

const habits = computed(() => habitsStore.getActiveHabits())
const todayHabits = computed(() => habits.value.filter(h => h.cycle === 'daily'))

const stats = computed(() => [
  { title: '活跃习惯', value: habits.value.length, icon: List, color: '#409eff' },
  { title: '今日已打卡', value: todayCompletedCount.value, icon: CircleCheck, color: '#67c23a' },
  { title: '连续打卡', value: 0, icon: Sunny, color: '#e6a23c' },
  { title: '总完成率', value: `${overallCompletionRate.value}%`, icon: DataAnalysis, color: '#909399' }
])

const todayCompletedCount = computed(() => {
  return todayHabits.value.filter(h => habitsStore.isCheckedToday(h.id)).length
})

const overallCompletionRate = computed(() => {
  if (habits.value.length === 0) return 0
  const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  const endDate = dayjs().format('YYYY-MM-DD')
  const stats = habitsStore.getAllStatistics(startDate, endDate)
  return stats.completionRate
})

const weekCompletionRate = computed(() => {
  if (habits.value.length === 0) return 0
  return Math.round((todayCompletedCount.value / Math.max(todayHabits.value.length, 1)) * 100)
})

const progressColor = computed(() => {
  if (weekCompletionRate.value >= 80) return '#67c23a'
  if (weekCompletionRate.value >= 50) return '#e6a23c'
  return '#f56c6c'
})

function getIconComponent(iconName) {
  const icons = {
    Calendar: CalendarIcon,
    List,
    CircleCheck,
    DataAnalysis,
    Trophy,
    Timer,
    Sunny
  }
  return icons[iconName] || List
}

function getTodayCount(habitId) {
  return habitsStore.getTodayCheckinCount(habitId)
}

function isChecked(habitId) {
  return habitsStore.isCheckedToday(habitId)
}

function toggleCheckin(habit) {
  if (isChecked(habit.id)) {
    habitsStore.uncheckin(habit.id)
  } else {
    habitsStore.checkin(habit.id)
  }
}

function getHabitsForDate(data) {
  const dateStr = data.dayjs.format('YYYY-MM-DD')
  return habits.value.filter(habit => {
    const checkin = habitsStore.getCheckinByDate(habit.id, dateStr)
    return checkin && checkin.count >= habit.targetCount
  })
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.content-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.flex-1 {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.habit-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.habit-item:hover {
  transform: translateX(4px);
}

.habit-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.habit-info {
  flex: 1;
}

.habit-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.habit-progress {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.habit-status {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 40px;
}

.completion-card {
  display: flex;
  flex-direction: column;
}

.completion-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.percentage {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
}

.calendar-card {
  padding: 0;
  overflow: hidden;
}

.calendar-card .card-header {
  padding: 20px 20px 0;
  margin-bottom: 0;
}

.calendar-cell {
  text-align: center;
  padding: 4px;
}

.day-number {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 4px;
}

.day-indicators {
  display: flex;
  justify-content: center;
  gap: 3px;
  flex-wrap: wrap;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

:deep(.el-calendar__body) {
  padding: 0 20px 20px;
}

:deep(.el-calendar-table) {
  border-spacing: 4px;
}

:deep(.el-calendar-table td) {
  padding: 4px;
  border-radius: 8px;
  border: none;
}

:deep(.el-calendar-table td.is-today) {
  background-color: rgba(64, 158, 255, 0.1);
}

:deep(.el-calendar-table td:hover) {
  background-color: var(--bg-color);
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>