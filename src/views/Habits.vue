<template>
  <div class="habits page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">习惯管理</h2>
        <el-tag size="small" type="info">共 {{ habits.length }} 个习惯</el-tag>
      </div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>
        新建习惯
      </el-button>
    </div>

    <div class="habits-grid" v-if="habits.length > 0">
      <div class="habit-card card" v-for="habit in habits" :key="habit.id">
        <div class="habit-card-header">
          <div class="habit-card-icon" :style="{ backgroundColor: habit.color + '20' }">
            <el-icon :size="28" :color="habit.color">
              <component :is="getIconComponent(habit.icon)" />
            </el-icon>
          </div>
          <div class="habit-card-actions">
            <el-dropdown @command="handleCommand">
              <el-button circle size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'edit', habit }">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', habit }" divided>
                    <el-icon><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="habit-card-body">
          <h3 class="habit-card-name">{{ habit.name }}</h3>
          <p class="habit-card-desc" v-if="habit.description">{{ habit.description }}</p>
        </div>
        
        <div class="habit-card-footer">
          <div class="habit-tag">
            <el-tag size="small" :type="getCycleType(habit.cycle)">
              {{ getCycleLabel(habit.cycle) }}
            </el-tag>
          </div>
          <div class="habit-target">
            <span class="target-text">目标: {{ habit.targetCount }} 次</span>
          </div>
          <div class="habit-reminder" v-if="habit.reminderEnabled">
            <el-icon><Bell /></el-icon>
            <span>{{ habit.reminderTime }}</span>
          </div>
        </div>
        
        <div class="habit-progress-section">
          <div class="progress-header">
            <span class="progress-label">本周完成</span>
            <span class="progress-value">{{ getWeekStats(habit.id)?.completedDays || 0 }} / 7 天</span>
          </div>
          <el-progress 
            :percentage="getWeekCompletionRate(habit.id)" 
            :stroke-width="8"
            :color="habit.color"
            show-text="false"
          />
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <el-empty description="还没有创建任何习惯" :image-size="120">
        <el-button type="primary" @click="openDialog()">
          创建第一个习惯
        </el-button>
      </el-empty>
    </div>

    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
        class="habit-form"
      >
        <el-form-item label="习惯名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：每天跑步30分钟" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="2" 
            placeholder="描述这个习惯（选填）"
          />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <div class="icon-picker">
            <div 
              v-for="icon in availableIcons" 
              :key="icon.value"
              class="icon-item"
              :class="{ active: form.icon === icon.value }"
              @click="form.icon = icon.value"
            >
              <el-icon :size="20">
                <component :is="icon.component" />
              </el-icon>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="颜色" prop="color">
          <div class="color-picker">
            <div 
              v-for="color in availableColors" 
              :key="color"
              class="color-item"
              :class="{ active: form.color === color }"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="周期" prop="cycle">
          <el-radio-group v-model="form.cycle">
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="monthly">每月</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="目标次数" prop="targetCount">
          <el-input-number v-model="form.targetCount" :min="1" :max="100" />
        </el-form-item>
        
        <el-form-item label="提醒设置">
          <div class="reminder-section">
            <el-switch v-model="form.reminderEnabled" />
            <el-time-picker 
              v-model="form.reminderTime" 
              placeholder="选择提醒时间" 
              :disabled="!form.reminderEnabled"
              value-format="HH:mm"
              style="margin-left: 12px;"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog 
      title="确认删除" 
      v-model="deleteDialogVisible" 
      width="400px"
    >
      <p>确定要删除习惯「{{ habitToDelete?.name }}」吗？</p>
      <p class="warning-text">此操作将同时删除该习惯的所有打卡记录，无法恢复。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import { ElMessage } from 'element-plus'
import { 
  Plus, MoreFilled, Edit, Delete, Bell,
  Calendar as CalendarIcon, List, Timer, 
  Trophy, Sunny, Coffee, Moon,
  Headset, Watermelon
} from '@element-plus/icons-vue'

const habitsStore = useHabitsStore()
const formRef = ref(null)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const habitToDelete = ref(null)
const editingHabitId = ref(null)

const form = reactive({
  name: '',
  description: '',
  icon: 'Calendar',
  color: '#409eff',
  cycle: 'daily',
  targetCount: 1,
  reminderEnabled: false,
  reminderTime: null
})

const rules = {
  name: [
    { required: true, message: '请输入习惯名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'change' }
  ],
  color: [
    { required: true, message: '请选择颜色', trigger: 'change' }
  ],
  cycle: [
    { required: true, message: '请选择周期', trigger: 'change' }
  ],
  targetCount: [
    { required: true, message: '请输入目标次数', trigger: 'blur' }
  ]
}

const availableIcons = [
  { value: 'Calendar', component: CalendarIcon },
  { value: 'List', component: List },
  { value: 'Timer', component: Timer },
  { value: 'Trophy', component: Trophy },
  { value: 'Sunny', component: Sunny },
  { value: 'Coffee', component: Coffee },
  { value: 'Moon', component: Moon },
  { value: 'Headset', component: Headset },
  { value: 'Watermelon', component: Watermelon }
]

const availableColors = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c',
  '#909399', '#00d4ff', '#ff6b6b', '#a55eea',
  '#20bf6b', '#eb3b5a', '#fa8231', '#3867d6'
]

const habits = computed(() => habitsStore.getActiveHabits())

const dialogTitle = computed(() => isEdit.value ? '编辑习惯' : '新建习惯')

function getIconComponent(iconName) {
  const icon = availableIcons.find(i => i.value === iconName)
  return icon?.component || CalendarIcon
}

function getCycleLabel(cycle) {
  const labels = { daily: '每日', weekly: '每周', monthly: '每月' }
  return labels[cycle] || cycle
}

function getCycleType(cycle) {
  const types = { daily: 'primary', weekly: 'success', monthly: 'warning' }
  return types[cycle] || 'info'
}

function getWeekStats(habitId) {
  return habitsStore.getWeeklyStatistics(habitId)
}

function getWeekCompletionRate(habitId) {
  const stats = getWeekStats(habitId)
  return stats?.completionRate || 0
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.icon = 'Calendar'
  form.color = '#409eff'
  form.cycle = 'daily'
  form.targetCount = 1
  form.reminderEnabled = false
  form.reminderTime = null
  isEdit.value = false
  editingHabitId.value = null
}

function openDialog(habit = null) {
  resetForm()
  if (habit) {
    isEdit.value = true
    editingHabitId.value = habit.id
    form.name = habit.name
    form.description = habit.description
    form.icon = habit.icon
    form.color = habit.color
    form.cycle = habit.cycle
    form.targetCount = habit.targetCount
    form.reminderEnabled = habit.reminderEnabled
    form.reminderTime = habit.reminderTime
  }
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      if (isEdit.value) {
        habitsStore.updateHabit(editingHabitId.value, { ...form })
        ElMessage.success('习惯更新成功')
      } else {
        habitsStore.addHabit({ ...form })
        ElMessage.success('习惯创建成功')
      }
      
      loading.value = false
      dialogVisible.value = false
      resetForm()
    }
  })
}

function handleCommand({ action, habit }) {
  if (action === 'edit') {
    openDialog(habit)
  } else if (action === 'delete') {
    habitToDelete.value = habit
    deleteDialogVisible.value = true
  }
}

function confirmDelete() {
  if (habitToDelete.value) {
    habitsStore.deleteHabit(habitToDelete.value.id)
    ElMessage.success('习惯已删除')
  }
  deleteDialogVisible.value = false
  habitToDelete.value = null
}
</script>

<style scoped>
.habits {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.habits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.habit-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.habit-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.habit-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.habit-card-actions {
  display: flex;
  gap: 8px;
}

.habit-card-body {
  flex: 1;
}

.habit-card-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px;
}

.habit-card-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.habit-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.habit-reminder {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.target-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.habit-progress-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.progress-label {
  color: var(--text-secondary);
}

.progress-value {
  color: var(--text-color);
  font-weight: 500;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.habit-form {
  padding: 10px 0;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 2px solid transparent;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s;
}

.icon-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.icon-item.active {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.15);
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.color-item {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: var(--text-color);
}

.reminder-section {
  display: flex;
  align-items: center;
}

.warning-text {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 8px;
}
</style>