// stores/useDataStore.js
import { RotateCwSquare } from 'lucide-vue-next'
import { defineStore } from 'pinia'
import { toLocalISO } from '~/utils/dateFormats' // Import your date utility

export const useDataStore = defineStore('datahub', () => {
  const config = useRuntimeConfig()
  
  // State
  const reports = ref([])
  const users = ref([])
  const schedules = ref([])
  const programs = ref([])
  const lessons = ref([])
  const certificates = ref([])
  const lessonsAssignment = ref([])
  const isLoading = ref(false)

  // 1. Transformer: Convert DB schedules into calendar-friendly events
  const schedulesToEvents = (scheduleList) => {
    return scheduleList.map(s => {
      const datePart = s.date ? toLocalISO(s.date) : ''
      return {
        ...s,
        title: s.program || 'Session',
        name: s.program || 'Session',
        displayDate: datePart || '---',
        date: datePart,
        start: datePart ? `${datePart} ${s.time_start}` : null,
        end: datePart ? `${datePart} ${s.time_end}` : null,
        color: s.color || '#6B7280'
      }
    })
  }

  // 2. Centralized Fetch Action
  async function fetchData(currentView) {
    isLoading.value = true
    const token = useCookie('token').value

    if (!token) {
      // console.log('going here')
      // console.log(token.value)
      navigateTo('/login')
      return
    }

    try {
      // If loading schedules, also fetch reports so Datahub has relationship mapping
      if (currentView === 'schedules') {
        const reportRes = await fetch(`${config.public.apiBase}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        reports.value = await reportRes.json()
      }

      const res = await fetch(`${config.public.apiBase}/api/${currentView}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const rawData = await res.json()

      // Assign formatted data to respective state
      if (currentView === 'schedules') {
        schedules.value = schedulesToEvents(rawData)
      } else if (currentView === 'reports') {
        reports.value = rawData.map(r => ({
          ...r,
          displayDate: r.date ? toLocalISO(r.date) : '---'
        }))
      } else if (currentView === 'users') {
        users.value = rawData
      } else if (currentView === 'programs') {
        programs.value = rawData
      } else if (currentView === 'lessons') {
        console.log("[---dataStore lessons---]")
        console.log(rawData)
        lessons.value = rawData
      } else if (currentView === 'lessonsAssignment') { // <-- ADD THIS BLOCK
        console.log("[---dataStore lessonsAssignment---]")
        console.log(rawData)
        lessonsAssignment.value = rawData
      }

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return { reports, users, schedules, programs, lessons, certificates, lessonsAssignment, isLoading, fetchData }
})