<template>
  <el-config-provider :locale="zhCn">
    <div id="app" :class="{ 'dark': isDark }">
      <router-view v-if="!isLoggedIn" />
      <MainLayout v-else />
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import MainLayout from '@/components/MainLayout.vue'

const themeStore = useThemeStore()
const userStore = useUserStore()

const isDark = computed(() => themeStore.isDark)
const isLoggedIn = computed(() => userStore.isLoggedIn)

onMounted(() => {
  themeStore.initTheme()
  userStore.initUser()
})

watch(isDark, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })
</script>

<style>
#app {
  min-height: 100%;
  width: 100%;
}
</style>