import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref(JSON.parse(localStorage.getItem('habits') || '[]'))
  const checkins = ref(JSON.parse(localStorage.getItem('checkins') || '[]'))

  const today = computed(() => dayjs().format('YYYY-MM-DD'))

  function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits.value))
  }

  function saveCheckins() {
    localStorage.setItem('checkins', JSON.stringify(checkins.value))
  }

  function addHabit(habit) {
    const newHabit = {
      id: Date.now(),
      name: habit.name,
      description: habit.description || '',
      icon: habit.icon || 'Calendar',
      color: habit.color || '#409eff',
      cycle: habit.cycle || 'daily',
      targetCount: habit.targetCount || 1,
      reminderTime: habit.reminderTime || null,
      reminderEnabled: habit.reminderEnabled || false,
      createdAt: dayjs().toISOString(),
      status: 'active'
    }
    habits.value.push(newHabit)
    saveHabits()
    return newHabit
  }

  function updateHabit(id, updates) {
    const index = habits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      habits.value[index] = { ...habits.value[index], ...updates }
      saveHabits()
      return habits.value[index]
    }
    return null
  }

  function deleteHabit(id) {
    const index = habits.value.findIndex(h => h.id === id)
    if (index !== -1) {
      habits.value.splice(index, 1)
      checkins.value = checkins.value.filter(c => c.habitId !== id)
      saveHabits()
      saveCheckins()
      return true
    }
    return false
  }

  function getHabitById(id) {
    return habits.value.find(h => h.id === id)
  }

  function getActiveHabits() {
    return habits.value.filter(h => h.status === 'active')
  }

  function checkin(habitId, date = today.value, count = 1) {
    const existingCheckin = checkins.value.find(
      c => c.habitId === habitId && c.date === date
    )
    
    if (existingCheckin) {
      existingCheckin.count += count
      existingCheckin.updatedAt = dayjs().toISOString()
    } else {
      const newCheckin = {
        id: Date.now(),
        habitId,
        date,
        count,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      }
      checkins.value.push(newCheckin)
    }
    
    saveCheckins()
    return true
  }

  function uncheckin(habitId, date = today.value) {
    const index = checkins.value.findIndex(
      c => c.habitId === habitId && c.date === date
    )
    if (index !== -1) {
      checkins.value.splice(index, 1)
      saveCheckins()
      return true
    }
    return false
  }

  function getCheckinByDate(habitId, date) {
    return checkins.value.find(c => c.habitId === habitId && c.date === date)
  }

  function isCheckedToday(habitId) {
    const checkin = getCheckinByDate(habitId, today.value)
    if (!checkin) return false
    const habit = getHabitById(habitId)
    return checkin.count >= (habit?.targetCount || 1)
  }

  function getTodayCheckinCount(habitId) {
    const checkin = getCheckinByDate(habitId, today.value)
    return checkin ? checkin.count : 0
  }

  function getStatistics(habitId, startDate, endDate) {
    const habit = getHabitById(habitId)
    if (!habit) return null

    const filteredCheckins = checkins.value.filter(c => {
      return c.habitId === habitId && c.date >= startDate && c.date <= endDate
    })

    const totalDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
    const completedDays = filteredCheckins.filter(c => c.count >= habit.targetCount).length
    const totalCount = filteredCheckins.reduce((sum, c) => sum + c.count, 0)
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    return {
      totalDays,
      completedDays,
      totalCount,
      completionRate,
      checkins: filteredCheckins
    }
  }

  function getWeeklyStatistics(habitId) {
    const endDate = today.value
    const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
    return getStatistics(habitId, startDate, endDate)
  }

  function getMonthlyStatistics(habitId) {
    const endDate = today.value
    const startDate = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
    return getStatistics(habitId, startDate, endDate)
  }

  function getAllStatistics(startDate, endDate) {
    const activeHabits = getActiveHabits()
    const result = {
      totalHabits: activeHabits.length,
      totalCheckins: 0,
      completionRate: 0,
      habits: []
    }

    activeHabits.forEach(habit => {
      const stats = getStatistics(habit.id, startDate, endDate)
      if (stats) {
        result.habits.push({
          ...habit,
          stats
        })
        result.totalCheckins += stats.completedDays
      }
    })

    const totalPossibleDays = result.totalHabits * (dayjs(endDate).diff(dayjs(startDate), 'day') + 1)
    result.completionRate = totalPossibleDays > 0 ? Math.round((result.totalCheckins / totalPossibleDays) * 100) : 0

    return result
  }

  return {
    habits,
    checkins,
    today,
    addHabit,
    updateHabit,
    deleteHabit,
    getHabitById,
    getActiveHabits,
    checkin,
    uncheckin,
    getCheckinByDate,
    isCheckedToday,
    getTodayCheckinCount,
    getStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics,
    getAllStatistics
  }
})