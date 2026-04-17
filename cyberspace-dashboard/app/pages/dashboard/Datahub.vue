<template>
  <v-container>
    <v-card class="rounded-lg">

      <DatahubToolbar
        v-model:view="currentView"
        v-model:search="search"
        v-model:searchColumn="searchColumn"
        :is-table-view="isTableView"
        :active-headers="activeHeaders"
        :filtered-options="filteredOptions"
        :can-manage-users="canManageUsers"
        @action="handleToolbarAction"
      />

      <DatahubTable
        v-if="isTableView"
        :headers="activeHeaders"
        :items="displayedItems"
        :search="search"
        :is-loading="isLoading"
        :current-view="currentView"
        :reports="data.reports"
        @go-to-calendar="goToCalendar"
        @edit-schedule="editSchedule"
        @manage-report="manageReport"
        @edit-report="editReport"
        @edit-user="editUser"
      />

      <DatahubProgramsGrid
        v-else
        :headers="activeHeaders"
        :items="displayedItems"
        :search="search"
        :is-loading="isLoading"
        @edit-program="editProgram"
      />
    </v-card>
    <ClientOnly>
      <ExportImportForm 
        v-model="dataActionOpen"
        :mode="dataActionMode"
        :headers="activeHeaders"
        :items="displayedItems"
        :view-name="currentViewLabel"
        :user-name="user?.username" 
        @confirmed="handleImportConfirm"
      />    
    </ClientOnly>
    <ReportForm 
      v-model="reportDialogOpen"
      :is-edit="isReportEditMode"
      :report-data="selectedReport"
      @saved="fetchData"
      @deleted="fetchData"
    />

    <ScheduleForm 
      v-model="scheduleDialogOpen"
      :is-edit="isScheduleEditMode" 
      :event-data="selectedSchedule"
      @saved="fetchData"
      @deleted="fetchData"
    />

    <ProgramForm 
      v-model="programDialogOpen" 
      :is-edit="!!selectedProgram.id" 
      :program-data="selectedProgram" 
      @saved="fetchData" 
      @deleted="fetchData" 
    />

    <UserForm 
      v-model="userDialogOpen" 
      :user-data="selectedUser" 
      @saved="fetchData" 
      @deleted="fetchData" 
    />


  </v-container>
</template>

<script setup>
  // 1. PAGE META
  definePageMeta({
    layout: 'dashboards',
  })

  // 2. COMPOSABLES & UTILITIES
  const { isTeacher, canManageUsers } = useAuth()
  const router = useRouter()
  const config = useRuntimeConfig()

  // 3. REACTIVE STATE (UI, Dialogs, & Data)
  const currentView = ref('schedules')
  const search = ref('')
  const isLoading = ref(false)
  const searchColumn = ref('all')

  // Reset the search column when the view changes
  function handleViewChange() {
    search.value = ''
    searchColumn.value = 'all' // Reset to global search
    fetchData()
  }

  // Dialog Controls
  const userDialogOpen = ref(false)
  const programDialogOpen = ref(false)
  const scheduleDialogOpen = ref(false)
  const reportDialogOpen = ref(false)
  const isReportEditMode = ref(false)
  const isScheduleEditMode = ref(false)
  const dataActionOpen = ref(false)
  const dataActionMode = ref('export')

  // Selected Data for Forms
  const selectedUser = ref({})
  const selectedProgram = ref({})
  const selectedSchedule = ref({})
  const selectedReport = ref({})

  // Primary Data Store
  const data = reactive({
    reports: [],
    users: [],
    schedules: [],
    programs: [],
    modules: []
  })

  // 4. CONFIGURATION & MAPS
  const currentViewLabel = computed(() => {
    return viewOptions.find(opt => opt.value === currentView.value)?.title || 'Data'
  })

  const { user } = useAuth()

  const viewOptions = [
    { title: 'Reports', value: 'reports' },
    { title: 'Schedules', value: 'schedules' },
    { title: 'Users', value: 'users' },
    { title: 'Programs', value: 'programs' },
    // { title: 'Modules', value: 'modules' }  
  ]

  const headersMap = {
    reports: [
      { title: 'Id - Teacher', key: 'teacher_name', align: 'start' },
      { title: 'Date', key: 'date', align: 'start' },
      { title: 'Start - End Time', key: 'time_start', align: 'start', sortable: false },
      { title: 'Program / Module', key: 'program', align: 'center' },
      { title: 'Attendance', key: 'total_student_attendance', align: 'center' },
      { title: 'Names', key: 'students_name', align: 'start', sortable: false },
      { title: 'Notes', key: 'notes', align: 'end' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
    ],
    schedules: [
      { title: 'Id - Teacher', key: 'teacher_name', align: 'start' },
      { title: 'Date', key: 'date', align: 'start' },
      { title: 'Start - End Time', key: 'time_start', align: 'start', sortable: false },
      { title: 'Program / Module', key: 'program', align: 'center' },
      { title: 'Location', key: 'location', align: 'center' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
    ],
    users: [
      { title: 'Id', key: 'id', align: 'start' },
      { title: 'Id - Teacher', key: 'username', align: 'start' },
      { title: 'Role', key: 'role_name', align: 'start' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
    ],
    programs: [
      { title: 'Title', key: 'title' },
      { title: 'Age Range', key: 'age_range' },
      { title: 'Description', key: 'description' },
      { title: 'ID', key: 'id' },
      { title: 'Status', key: 'is_active' }
    ]
  }

  // 5. COMPUTED PROPERTIES
  const isTableView = computed(() => {
    return ['schedules', 'users', 'reports'].includes(currentView.value)
  })

  const filteredOptions = computed(() => {
    if (isTeacher.value) {
      return viewOptions.filter(opt => 
        ['reports', 'schedules'].includes(opt.value)
      )
    }
    return viewOptions
  })

  const activeHeaders = computed(() => headersMap[currentView.value])

  const displayedItems = computed(() => {
    const rawItems = data[currentView.value] || []
    if (!search.value) return rawItems
    
    const s = search.value.toLowerCase()

    return rawItems.filter(item => {
      if (searchColumn.value !== 'all') {
        const val = item[searchColumn.value]
        return String(val || '').toLowerCase().includes(s)
      }

      return Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(s)
      )
    })
  })

  // 6. METHODS (API Actions)
  // async function fetchData() {
  //   isLoading.value = true
  //   const token = useCookie('token')

  //   try {
  //     if (currentView.value === 'schedules') {
  //       const reportRes = await fetch(`${config.public.apiBase}/api/reports`, {
  //         headers: { 'Authorization': `Bearer ${token.value}` } 
  //       })
  //       data.reports = await reportRes.json()
  //     }

  //     const res = await fetch(`${config.public.apiBase}/api/${currentView.value}`, {
  //       headers: { 'Authorization': `Bearer ${token.value}` } 
  //     })
  //     data[currentView.value] = await res.json()
  //     console.log('dat', data)
  //   } catch (err) {
  //     console.error("Fetch error:", err)
  //   } finally {
  //     isLoading.value = false
  //   }
  // }
async function fetchData() {
    isLoading.value = true
    const token = useCookie('token')

    try {
      if (currentView.value === 'schedules') {
        const reportRes = await fetch(`${config.public.apiBase}/api/reports`, {
          headers: { 'Authorization': `Bearer ${token.value}` } 
        })
        data.reports = await reportRes.json()
      }

      const res = await fetch(`${config.public.apiBase}/api/${currentView.value}`, {
        headers: { 'Authorization': `Bearer ${token.value}` } 
      })
      const rawData = await res.json()

      // CRITICAL: Use formatDate() here, not displayDate
      data[currentView.value] = rawData.map(item => ({
        ...item,
        date: item.date ? formatDate(item.date) : '---'
      }))
      console.log(data)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      isLoading.value = false
    }
  }

  // 7. METHODS (UI & Navigation)
  function hasReport(schedule) {
    // data.reports is your reactive store of all reports
    return data.reports.some(r => r.schedule_id === schedule.id)
  }
  
  function goToCalendar(item) {
    if (!item.date) return
    router.push({ path: '/dashboard/schedules', query: { focus: item.date.split('T')[0] } })
  }

  async function handleImportConfirm(parsedData) {
    isLoading.value = true
    const token = useCookie('token')
    
    try {
      // Send the parsed data to your specific endpoint
      const res = await fetch(`${config.public.apiBase}/api/${currentView.value}/bulk`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsedData)
      })
      
      if (res.ok) {
        alert(`Successfully imported ${parsedData.length} records!`)
        dataActionOpen.value = false
        fetchData() // Refresh the main table
      }
    } catch (err) {
      console.error("Import failed:", err)
      alert("Import failed. Check console for details.")
    } finally {
      isLoading.value = false
    }
  }

  // 8. METHODS (Form & Dialog Handlers)
  function handleToolbarAction(action) {
    if (action === 'export' || action === 'import') {
      openDataDialog(action)
    } else if (action === 'create') {
      openCreateForm()
    }
  }

  function openDataDialog(mode) {
    dataActionMode.value = mode
    dataActionOpen.value = true
  }

  function openCreateForm() {
    if (currentView.value === 'schedules') {
      isScheduleEditMode.value = false
      selectedSchedule.value = {
        date: new Date().toISOString().split('T')[0],
        time_start: '09:00',
        time_end: '10:30'
      }
      scheduleDialogOpen.value = true
    } 
    else if (currentView.value === 'programs') {
      selectedProgram.value = {} 
      programDialogOpen.value = true
    }
  }

  function editUser(item) {
    selectedUser.value = { ...item }
    userDialogOpen.value = true
  }

  function editSchedule(item) {
    selectedSchedule.value = { ...item }
    isScheduleEditMode.value = true
    scheduleDialogOpen.value = true
  }

  function editProgram(item){
    selectedProgram.value = { ...item }
    programDialogOpen.value = true
  }

  function editReport(item) {
    selectedReport.value = { ...item }
    isReportEditMode.value = true
    reportDialogOpen.value = true
  }

  function manageReport(schedule) {
    const existingReport = data.reports.find(r => r.schedule_id === schedule.id)
    if (existingReport) {
      selectedReport.value = { ...existingReport }
      isReportEditMode.value = true
    } else {
      selectedReport.value = { ...schedule } 
      isReportEditMode.value = false
    }
    reportDialogOpen.value = true
  }

  // 9. LIFECYCLE
  onMounted(() => fetchData())
</script>