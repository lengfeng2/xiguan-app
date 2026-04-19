<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" :color="primaryColor"><Calendar /></el-icon>
        <span class="title">习惯追踪</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        :text-color="isDark ? '#a0a0a0' : '#606266'"
        :active-text-color="primaryColor"
        router
        class="menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/habits">
          <el-icon><List /></el-icon>
          <span>习惯管理</span>
        </el-menu-item>
        <el-menu-item index="/checkin">
          <el-icon><CircleCheck /></el-icon>
          <span>每日打卡</span>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu>
      <div class="user-info">
        <el-avatar :size="40" class="avatar">
          {{ username.charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="user-detail">
          <div class="username">{{ username }}</div>
          <el-button type="text" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-aside>
    <el-main class="main-content">
      <div class="header-bar">
        <div class="page-title">{{ currentTitle }}</div>
        <div class="header-actions">
          <el-tooltip :content="isDark ? '切换亮色模式' : '切换暗色模式'" placement="bottom">
            <el-button :icon="isDark ? Sunny : Moon" circle @click="toggleTheme" />
          </el-tooltip>
          <el-tooltip content="通知提醒" placement="bottom">
            <el-badge :value="notificationCount" :hidden="notificationCount === 0">
              <el-button :icon="Bell" circle />
            </el-badge>
          </el-tooltip>
        </div>
      </div>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { House, List, CircleCheck, DataAnalysis, Setting, Calendar, Sunny, Moon, Bell } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const activeMenu = computed(() => route.path)
const username = computed(() => userStore.username)
const isDark = computed(() => themeStore.isDark)
const notificationCount = computed(() => 0)
const primaryColor = '#409eff'

const currentTitle = computed(() => {
  const titles = {
    '/dashboard': '首页',
    '/habits': '习惯管理',
    '/checkin': '每日打卡',
    '/statistics': '数据统计',
    '/settings': '设置'
  }
  return titles[route.path] || '习惯追踪'
})

function toggleTheme() {
  themeStore.toggleTheme()
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100%;
}

.sidebar {
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 30px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin-left: 12px;
  color: var(--text-color);
}

.menu {
  border-right: none;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  margin: 4px 12px;
  border-radius: 8px;
  height: 48px;
}

.menu :deep(.el-menu-item:hover) {
  background-color: rgba(64, 158, 255, 0.1);
}

.menu :deep(.el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.15);
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.user-detail {
  margin-left: 12px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.main-content {
  background-color: var(--bg-color);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.header-actions {
  display: flex;
  gap: 12px;
}
</style>