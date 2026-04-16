// app/composables/useSchedules.js
export const useSchedules = () => {
  const events = ref([])
  const isLoading = ref(false)
  const config = useRuntimeConfig()
  const token = useCookie('token')

  // 1. Transform DB dates to Calendar-friendly events
  const schedulesToEvents = (schedules) => {
    return schedules.map(s => {
      const datePart = toLocalISO(s.date) // Using your new utility!
      return {
        title: s.program,
        start: `${datePart} ${s.time_start}`,
        end: `${datePart} ${s.time_end}`,
        color: s.color || '#6B7280',
        ...s,
        date: datePart
      }
    })
  }

  // 2. Fetch from API
  const getEvents = async () => {
    isLoading.value = true
    try {
      const res = await fetch(`${config.public.apiBase}/api/schedules`, {
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
      const data = await res.json()
      events.value = schedulesToEvents(data)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      isLoading.value = false
    }
  }

  return { events, isLoading, getEvents }
}