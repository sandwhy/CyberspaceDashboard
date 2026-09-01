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
      <TeacherAssignedLessons v-if="currentView === 'teacherAssignedLessons'" />
      <TeacherProgressChecker v-else-if="currentView === 'lessonProgressCheck'" />
      
      <DatahubTable 
        v-else-if="isTableView"
        :headers="activeHeaders"
        :items="displayedItems"
        :search="search"
        :is-loading="dataStore.isLoading"
        :current-view="currentView"
        :reports="dataStore.reports"
        @go-to-calendar="goToCalendar"
        @edit-schedule="editSchedule"
        @manage-report="manageReport"
        @edit-report="editReport"
        @edit-user="editUser"
        @edit-program-assignment="editProgramAssignment"
        @go-to-lessons="goToLessons"
      />
      
      <DatahubProgramsGrid
        v-else
        :headers="activeHeaders"
        :items="displayedItems"
        :search="search"
        :is-loading="dataStore.isLoading"
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
      @saved="refreshCurrentView"
      @deleted="refreshCurrentView"
    />

    <ScheduleForm 
      v-model="scheduleDialogOpen"
      :is-edit="isScheduleEditMode" 
      :event-data="selectedSchedule"
      @saved="refreshCurrentView"
      @deleted="refreshCurrentView"
    />

    <ProgramForm 
      v-model="programDialogOpen" 
      :is-edit="!!selectedProgram.id" 
      :program-data="selectedProgram" 
      @saved="refreshCurrentView" 
      @deleted="refreshCurrentView" 
    />

    <UserForm 
      v-model="userDialogOpen" 
      :user-data="selectedUser" 
      @saved="refreshCurrentView" 
      @deleted="refreshCurrentView" 
    />

    <AssignTeacherDialog 
      v-model="assignTeachersOpen" 
      :program="selectedProgram" 
      @saved="refreshCurrentView" 
    />

  </v-container>
</template>

<script setup>
  // 1. PAGE META
  definePageMeta({
    layout: 'dashboards',
  })

  // 2. COMPOSABLES, STORES & UTILITIES
  const { isTeacher, canManageUsers, user } = useAuth()
  const router = useRouter()
  const config = useRuntimeConfig()
  const dataStore = useDataStore()

  // 3. REACTIVE STATE (UI & Dialog Controls)
  const currentView = ref('schedules')
  const search = ref('')
  const searchColumn = ref('all')

  // Helper function to trigger store fetch for active view
  function refreshCurrentView() {
    dataStore.fetchData(currentView.value)
  }

  // Reset search and fetch new view data on tab change
  watch(currentView, async (newView) => {
    // 1. Reset search states so the DatahubToolbar doesn't break
    // trying to filter by a column that doesn't exist in the new table
    search.value = ''
    // 2. Clear the selected column (or set it to the first available header)
    searchColumn.value = null 
    // 3. Fetch the new data
    await dataStore.fetchData(newView)
  }, { immediate: true })

  // Dialog Controls
  const userDialogOpen = ref(false)
  const programDialogOpen = ref(false)
  const scheduleDialogOpen = ref(false)
  const reportDialogOpen = ref(false)
  const isReportEditMode = ref(false)
  const isScheduleEditMode = ref(false)
  const dataActionOpen = ref(false)
  const dataActionMode = ref('export')
  const assignTeachersOpen = ref(false)

  // Selected Data for Forms
  const selectedUser = ref({})
  const selectedProgram = ref({})
  const selectedSchedule = ref({})
  const selectedReport = ref({})

  // 4. CONFIGURATION & MAPS
  const viewOptions = [
    { title: 'Schedules', value: 'schedules' },
    { title: 'Reports', value: 'reports' },
    { title: 'Programs', value: 'programs' },
    { title: 'Users', value: 'users' },
    { title: 'My Assigned Lessons', value: 'teacherAssignedLessons' },
    { title: 'Assign Lessons (operator)', value: 'lessonsAssignment' },
    { title: 'Lesson Progress Check (operator)', value: 'lessonProgressCheck' },

  ]

  const currentViewLabel = computed(() => {
    return viewOptions.find(opt => opt.value === currentView.value)?.title || 'Data'
  })

  const headersMap = {
    reports: [
      { title: 'Id - Teacher', key: 'teacher_name', align: 'start' },
      { title: 'Date', key: 'displayDate', align: 'start' },
      { title: 'Start - End Time', key: 'time_start', align: 'start', sortable: false },
      { title: 'Program / Module', key: 'program', align: 'center' },
      { title: 'Attendance', key: 'total_student_attendance', align: 'center' },
      { title: 'Names', key: 'students_name', align: 'start', sortable: false },
      { title: 'Notes', key: 'notes', align: 'end' },
      { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
    ],
    schedules: [
      { title: 'Id - Teacher', key: 'teacher_name', align: 'start' },
      { title: 'Date', key: 'displayDate', align: 'start' },
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
      { title: 'Status', key: 'is_active' },
    ],
    lessonsAssignment: [
      { key: 'id', title: 'ID', sortable: true },
      { key: 'program_title', title: 'Program Title', sortable: true },
      { key: 'lessons_count', title: 'Lessons', sortable: true },
      { key: 'status', title: 'Status', sortable: true },
      { key: 'assigned_teachers', title: 'Assigned Teachers', sortable: false },
      { key: 'actions', title: 'Actions', sortable: false, align: 'center' }
    ]
  }

  // 5. COMPUTED PROPERTIES
  const isTableView = computed(() => {
    return ['schedules', 'users', 'reports', 'lessonsAssignment', 'lessons', 'teacherAssignedLessons'].includes(currentView.value)
  })

  const filteredOptions = computed(() => {
    if (isTeacher) {
      return viewOptions.filter(opt => 
        ['reports', 'schedules', 'teacherAssignedLessons'].includes(opt.value)
      )
    }
    return viewOptions
  })

  const activeHeaders = computed(() => headersMap[currentView.value])

  //  Reads dynamic view state directly from Pinia Store
  const displayedItems = computed(() => {
    const rawItems = dataStore[currentView.value] || []
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

  // 6. METHODS (UI & Navigation)
  function hasReport(schedule) {
    //  Reads reports array from Pinia Store
    return dataStore.reports.some(r => r.schedule_id === schedule.id)
  }
  
  function goToCalendar(item) {
    if (!item.date) return
    router.push({ path: '/dashboard/schedules', query: { focus: item.date.split('T')[0] } })
  }

  function goToLessons(item){
    console.log("--- datahub gotolessons")
    console.log(item.id)
    if (!item.id) return
    router.push({ path: '/dashboard/createLessons', query: { program_id: item.id } })
  }

  async function handleImportConfirm(parsedData) {
    const token = useCookie('token')
    try {
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
        refreshCurrentView() // Refresh store data
      }
    } catch (err) {
      console.error("Import failed:", err)
      alert("Import failed. Check console for details.")
    }
  }

  // 7. METHODS (Form & Dialog Handlers)
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
    console.log("--- datahub edituser")
    selectedUser.value = { ...item }
    userDialogOpen.value = true
  }

  function editSchedule(item) {
    selectedSchedule.value = { ...item }
    isScheduleEditMode.value = true
    scheduleDialogOpen.value = true
  }

  function editProgram(item) {
    selectedProgram.value = { ...item }
    programDialogOpen.value = true
  }

  function editReport(item) {
    selectedReport.value = { ...item }
    isReportEditMode.value = true
    reportDialogOpen.value = true
  }

  function manageReport(schedule) {
    //  Reads reports from Pinia Store
    const existingReport = dataStore.reports.find(r => r.schedule_id === schedule.id)
    if (existingReport) {
      selectedReport.value = { ...existingReport }
      isReportEditMode.value = true
    } else {
      selectedReport.value = { ...schedule } 
      isReportEditMode.value = false
    }
    reportDialogOpen.value = true
  }

  function editProgramAssignment(item){
    console.log('--- datahub editprogramassignment')
    selectedProgram.value = item
    assignTeachersOpen.value = true
  }

  // 8. LIFECYCLE
  onMounted(() => refreshCurrentView())
</script>