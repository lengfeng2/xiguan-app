<template>
  <div class="settings page-container">
    <div class="settings-card card">
      <h3 class="section-title">主题设置</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">暗色模式</div>
          <div class="setting-desc">切换应用的亮色/暗色主题</div>
        </div>
        <div class="setting-action">
          <el-switch 
            v-model="isDark" 
            active-color="#409eff"
            @change="handleThemeChange"
          />
        </div>
      </div>
      
      <div class="theme-preview" v-if="isDark">
        <div class="preview-item dark-preview">
          <span>暗色主题预览</span>
        </div>
      </div>
    </div>

    <div class="settings-card card">
      <h3 class="section-title">通知设置</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">打卡提醒</div>
          <div class="setting-desc">在设定的时间发送打卡提醒</div>
        </div>
        <div class="setting-action">
          <el-switch 
            v-model="notificationsEnabled" 
            active-color="#67c23a"
            @change="handleNotificationToggle"
          />
        </div>
      </div>
      
      <div class="setting-item" v-if="notificationsEnabled">
        <div class="setting-info">
          <div class="setting-label">提醒时间</div>
          <div class="setting-desc">选择发送提醒的时间</div>
        </div>
        <div class="setting-action">
          <el-time-picker
            v-model="reminderTime"
            placeholder="选择时间"
            value-format="HH:mm"
            @change="handleReminderTimeChange"
          />
        </div>
      </div>
      
      <div class="setting-item" v-if="notificationsEnabled">
        <div class="setting-info">
          <div class="setting-label">测试通知</div>
          <div class="setting-desc">发送一条测试通知确认功能正常</div>
        </div>
        <div class="setting-action">
          <el-button type="primary" size="small" @click="testNotification">
            发送测试通知
          </el-button>
        </div>
      </div>
      
      <div class="notification-permission" v-if="notificationsEnabled && notificationPermission !== 'granted'">
        <el-alert 
          title="需要通知权限" 
          :description="notificationPermissionDesc"
          type="warning"
          show-icon
        >
          <template #default>
            <el-button type="primary" size="small" @click="requestNotificationPermission">
              开启通知权限
            </el-button>
          </template>
        </el-alert>
      </div>
    </div>

    <div class="settings-card card">
      <h3 class="section-title">数据管理</h3>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">导出数据</div>
          <div class="setting-desc">导出所有习惯和打卡记录为JSON文件</div>
        </div>
        <div class="setting-action">
          <el-button size="small" @click="exportData">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">导入数据</div>
          <div class="setting-desc">从JSON文件导入习惯和打卡记录</div>
        </div>
        <div class="setting-action">
          <el-button size="small" @click="triggerImport">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <input 
            type="file" 
            ref="fileInput" 
            accept=".json" 
            @change="importData"
            style="display: none;"
          />
        </div>
      </div>
      
      <div class="setting-item danger">
        <div class="setting-info">
          <div class="setting-label">清除数据</div>
          <div class="setting-desc">清除所有习惯和打卡记录（此操作不可恢复）</div>
        </div>
        <div class="setting-action">
          <el-button type="danger" size="small" @click="showClearDialog = true">
            <el-icon><Delete /></el-icon>
            清除
          </el-button>
        </div>
      </div>
    </div>

    <div class="settings-card card">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <div class="app-info">
          <div class="app-logo">
            <el-icon :size="48" color="#409eff"><Calendar /></el-icon>
          </div>
          <div class="app-details">
            <div class="app-name">习惯追踪</div>
            <div class="app-version">版本 1.0.0</div>
          </div>
        </div>
        <div class="app-desc">
          一款帮助您养成良好习惯的应用，支持习惯管理、每日打卡、数据统计等功能。
        </div>
      </div>
    </div>

    <el-dialog
      title="确认清除数据"
      v-model="showClearDialog"
      width="400px"
    >
      <p>确定要清除所有习惯和打卡记录吗？</p>
      <p class="warning-text">此操作不可恢复，请谨慎操作！</p>
      <template #footer>
        <el-button @click="showClearDialog = false">取消</el-button>
        <el-button type="danger" @click="clearAllData">确认清除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useHabitsStore } from '@/stores/habits'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Calendar, Download, Upload, Delete, Bell
} from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const habitsStore = useHabitsStore()

const isDark = computed(() => themeStore.isDark)
const fileInput = ref(null)
const showClearDialog = ref(false)

const notificationsEnabled = ref(localStorage.getItem('notificationsEnabled') === 'true')
const reminderTime = ref(localStorage.getItem('reminderTime') || '20:00')
const notificationPermission = ref('default')

const notificationPermissionDesc = computed(() => {
  if (notificationPermission.value === 'denied') {
    return '通知权限已被拒绝，请在浏览器设置中手动开启'
  }
  return '需要您授权才能接收打卡提醒通知'
})

let notificationInterval = null

function handleThemeChange(val) {
  themeStore.setTheme(val)
}

function handleNotificationToggle(val) {
  notificationsEnabled.value = val
  localStorage.setItem('notificationsEnabled', val ? 'true' : 'false')
  
  if (val) {
    if (notificationPermission.value === 'default') {
      requestNotificationPermission()
    } else if (notificationPermission.value === 'granted') {
      startNotificationChecker()
    }
  } else {
    stopNotificationChecker()
  }
}

function handleReminderTimeChange(val) {
  reminderTime.value = val
  localStorage.setItem('reminderTime', val)
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    ElMessage.warning('您的浏览器不支持通知功能')
    return
  }
  
  Notification.requestPermission().then(permission => {
    notificationPermission.value = permission
    if (permission === 'granted') {
      ElMessage.success('通知权限已开启')
      startNotificationChecker()
    } else {
      ElMessage.warning('通知权限未授权，无法接收提醒')
    }
  })
}

function testNotification() {
  if (!('Notification' in window)) {
    ElMessage.warning('您的浏览器不支持通知功能')
    return
  }
  
  if (notificationPermission.value === 'granted') {
    new Notification('习惯追踪 - 测试通知', {
      body: '这是一条测试通知，通知功能正常工作！',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiM0MDllZmYiLz4KPHBhdGggZD0iTTMyIDE2VjMyTDQwIDQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4='
    })
    ElMessage.success('测试通知已发送')
  } else {
    ElMessage.warning('请先开启通知权限')
  }
}

function startNotificationChecker() {
  stopNotificationChecker()
  
  notificationInterval = setInterval(() => {
    checkAndSendNotification()
  }, 60000)
}

function stopNotificationChecker() {
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
}

function checkAndSendNotification() {
  if (!notificationsEnabled.value || notificationPermission.value !== 'granted') return
  
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  if (currentTime === reminderTime.value) {
    const activeHabits = habitsStore.getActiveHabits()
    const todayHabits = activeHabits.filter(h => h.cycle === 'daily')
    const uncheckedHabits = todayHabits.filter(h => !habitsStore.isCheckedToday(h.id))
    
    if (uncheckedHabits.length > 0) {
      new Notification('习惯追踪提醒', {
        body: `您还有 ${uncheckedHabits.length} 个习惯待打卡！`,
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjgiIGZpbGw9IiM0MDllZmYiLz4KPHBhdGggZD0iTTMyIDE2VjMyTDQwIDQwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4='
      })
    }
  }
}

function exportData() {
  const data = {
    habits: JSON.parse(localStorage.getItem('habits') || '[]'),
    checkins: JSON.parse(localStorage.getItem('checkins') || '[]'),
    exportDate: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

function triggerImport() {
  fileInput.value?.click()
}

function importData(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(String(e.target?.result))
      
      if (data.habits) {
        localStorage.setItem('habits', JSON.stringify(data.habits))
      }
      if (data.checkins) {
        localStorage.setItem('checkins', JSON.stringify(data.checkins))
      }
      
      ElMessage.success('数据导入成功')
      location.reload()
    } catch (error) {
      ElMessage.error('导入失败，请确保文件格式正确')
    }
  }
  reader.readAsText(file)
  
  event.target.value = ''
}

async function clearAllData() {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除所有数据，确定继续吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localStorage.removeItem('habits')
    localStorage.removeItem('checkins')
    showClearDialog.value = false
    ElMessage.success('数据已清除')
    location.reload()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission
  }
  
  if (notificationsEnabled.value && notificationPermission.value === 'granted') {
    startNotificationChecker()
  }
})

watch(isDark, () => {
  // 主题切换已在 store 中处理
})
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
}

.settings-card {
  padding: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger .setting-label {
  color: #f56c6c;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-preview {
  margin-top: 16px;
}

.preview-item {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.dark-preview {
  background-color: #1f1f1f;
  color: #ffffff;
}

.notification-permission {
  margin-top: 16px;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-logo {
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%);
  border-radius: 16px;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.app-version {
  font-size: 14px;
  color: var(--text-secondary);
}

.app-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.warning-text {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 8px;
}
</style>