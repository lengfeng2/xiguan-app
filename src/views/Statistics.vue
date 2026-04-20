<template>
  <div class="statistics page-container">
    <div class="stats-summary card">
      <div class="summary-header">
        <h3 class="summary-title">总体统计</h3>
        <el-select v-model="timeRange" @change="updateStats" style="width: 140px;">
          <el-option label="近7天" value="week" />
          <el-option label="近30天" value="month" />
          <el-option label="近90天" value="quarter" />
        </el-select>
      </div>
      <div class="summary-stats">
        <div class="summary-item">
          <div class="summary-icon" style="background-color: rgba(64, 158, 255, 0.1);">
            <el-icon :size="24" color="#409eff"><List /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">{{ overallStats.totalHabits }}</div>
            <div class="summary-label">活跃习惯</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-icon" style="background-color: rgba(103, 194, 58, 0.1);">
            <el-icon :size="24" color="#67c23a"><CircleCheck /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">{{ overallStats.totalCheckins }}</div>
            <div class="summary-label">完成次数</div>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-icon" :style="{ backgroundColor: completionColorBg }">
            <el-icon :size="24" :color="completionColor"><TrendCharts /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value" :style="{ color: completionColor }">{{ overallStats.completionRate }}%</div>
            <div class="summary-label">完成率</div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card card">
        <h3 class="chart-title">习惯完成趋势</h3>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card card">
        <h3 class="chart-title">各习惯完成占比</h3>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="habits-stats card">
      <h3 class="card-title">各习惯详情</h3>
      <el-table :data="overallStats.habits" stripe style="width: 100%">
        <el-table-column prop="name" label="习惯名称" min-width="180">
          <template #default="{ row }">
            <div class="habit-name-cell">
              <div class="habit-color" :style="{ backgroundColor: row.color }"></div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="周期" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getCycleType(row.cycle)">
              {{ getCycleLabel(row.cycle) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stats.completedDays" label="完成天数" width="100" align="center" />
        <el-table-column prop="stats.totalDays" label="统计天数" width="100" align="center" />
        <el-table-column prop="stats.totalCount" label="总打卡数" width="100" align="center" />
        <el-table-column prop="stats.completionRate" label="完成率" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.stats.completionRate" 
              :color="getProgressColor(row.stats.completionRate)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="calendar-card card" v-if="selectedHabit">
      <div class="card-header">
        <h3 class="card-title">「{{ selectedHabit.name }}」打卡日历</h3>
        <el-button size="small" @click="selectedHabit = null">关闭</el-button>
      </div>
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click="viewDayDetail(data)">
            <div class="day-number">{{ data.day }}</div>
            <div class="day-status" :class="getDayStatus(data)">
              <el-icon v-if="isDayCompleted(data)" size="14" color="#67c23a">
                <CircleCheck />
              </el-icon>
            </div>
          </div>
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { 
  List, CircleCheck, TrendCharts, Calendar as CalendarIcon,
  Timer, Trophy, Sunny, Coffee, Moon, Headset, Watermelon
} from '@element-plus/icons-vue'

const habitsStore = useHabitsStore()

const timeRange = ref('week')
const trendChartRef = ref(null)
const pieChartRef = ref(null)
const selectedHabit = ref(null)
const calendarDate = ref(new Date())
let trendChart = null
let pieChart = null

const dateRanges = {
  week: 7,
  month: 30,
  quarter: 90
}

const startDate = computed(() => {
  const days = dateRanges[timeRange.value]
  return dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
})

const endDate = computed(() => dayjs().format('YYYY-MM-DD'))

const overallStats = computed(() => {
  return habitsStore.getAllStatistics(startDate.value, endDate.value)
})

const completionColor = computed(() => {
  if (overallStats.value.completionRate >= 80) return '#67c23a'
  if (overallStats.value.completionRate >= 50) return '#e6a23c'
  return '#f56c6c'
})

const completionColorBg = computed(() => {
  if (overallStats.value.completionRate >= 80) return 'rgba(103, 194, 58, 0.1)'
  if (overallStats.value.completionRate >= 50) return 'rgba(230, 162, 60, 0.1)'
  return 'rgba(245, 108, 108, 0.1)'
})

function getCycleLabel(cycle) {
  const labels = { daily: '每日', weekly: '每周', monthly: '每月' }
  return labels[cycle] || cycle
}

function getCycleType(cycle) {
  const types = { daily: 'primary', weekly: 'success', monthly: 'warning' }
  return types[cycle] || 'info'
}

function getProgressColor(percentage) {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

function updateStats() {
  nextTick(() => {
    initCharts()
  })
}

function initTrendChart() {
  if (!trendChartRef.value) return
  
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const days = dateRanges[timeRange.value]
  const dates = []
  const completedCounts = []
  const totalCounts = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day')
    dates.push(date.format('MM-DD'))
    
    let completed = 0
    const total = habitsStore.getActiveHabits().length
    
    habitsStore.getActiveHabits().forEach(habit => {
      const checkin = habitsStore.getCheckinByDate(habit.id, date.format('YYYY-MM-DD'))
      if (checkin && checkin.count >= habit.targetCount) {
        completed++
      }
    })
    
    completedCounts.push(completed)
    totalCounts.push(total)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['已完成', '总习惯'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: days > 14 ? 45 : 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        smooth: true,
        data: completedCounts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        },
        lineStyle: { color: '#67c23a', width: 2 },
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '总习惯',
        type: 'line',
        smooth: true,
        data: totalCounts,
        lineStyle: { color: '#909399', width: 1, type: 'dashed' },
        itemStyle: { color: '#909399' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  if (pieChart) {
    pieChart.dispose()
  }
  
  pieChart = echarts.init(pieChartRef.value)
  
  const data = overallStats.value.habits.map(habit => ({
    name: habit.name,
    value: habit.stats.completedDays,
    itemStyle: { color: habit.color }
  })).filter(d => d.value > 0)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 天 ({d}%)',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 10,
      textStyle: { color: 'var(--text-color)' }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'var(--card-bg)',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.length > 0 ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: '#909399' } }]
      }
    ]
  }
  
  pieChart.setOption(option)
}

function initCharts() {
  initTrendChart()
  initPieChart()
}

function isDayCompleted(data) {
  if (!selectedHabit.value) return false
  const dateStr = data.dayjs.format('YYYY-MM-DD')
  const checkin = habitsStore.getCheckinByDate(selectedHabit.value.id, dateStr)
  return checkin && checkin.count >= selectedHabit.value.targetCount
}

function getDayStatus(data) {
  if (!selectedHabit.value) return ''
  if (isDayCompleted(data)) return 'completed'
  return ''
}

function viewDayDetail(data) {
  console.log('查看详情:', data.dayjs.format('YYYY-MM-DD'))
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    
    window.addEventListener('resize', () => {
      trendChart?.resize()
      pieChart?.resize()
    })
  })
})

watch(timeRange, () => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.statistics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-summary {
  padding: 24px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.habits-stats {
  padding: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px;
}

.habit-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.habit-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-card {
  padding: 24px;
}

.calendar-cell {
  text-align: center;
  padding: 4px;
  cursor: pointer;
}

.day-number {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 4px;
}

.day-status {
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-calendar__body) {
  padding: 0;
}

:deep(.el-calendar-table) {
  border-spacing: 4px;
}

:deep(.el-calendar-table td) {
  padding: 8px 4px;
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
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>