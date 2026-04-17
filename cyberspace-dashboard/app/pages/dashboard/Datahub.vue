<template>
  <v-container>
    <v-card class="rounded-lg">

      <v-card-title class="d-flex align-center pa-6">
        <v-select
          v-model="currentView"
          :items="filteredOptions"
          label="View Data"
          variant="outlined"
          density="compact"
          hide-details
          class="mr-4"
          style="max-width: 160px"
          color="primary"
          @update:model-value="handleViewChange"
        ></v-select>
        
        <v-select
          v-model="searchColumn"
          :items="[{ title: 'All Columns', value: 'all' }, ...activeHeaders]"
          item-title="title"
          item-value="key"
          label="Search By"
          variant="outlined"
          density="compact"
          hide-details
          class="mr-2"
          style="max-width: 180px"
          v-if="isTableView"
        ></v-select>

        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :label="searchColumn === 'all' ? 'Search all fields' : `Search ${searchColumn}`"
          variant="solo"
          flat
          hide-details
          class="px-2"
        ></v-text-field>
        
        <v-spacer></v-spacer>

        <v-btn 
          v-if="['schedules', 'reports'].includes(currentView)"
          color="success" 
          prepend-icon="mdi-file-export" 
          variant="tonal"
          class="mr-2 rounded-lg text-none"
          @click="openDataDialog('export')"
        >
          Export CSV
        </v-btn>

        <v-btn 
          v-if="['schedules'].includes(currentView) && canManageUsers"
          color="warning" 
          prepend-icon="mdi-file-import" 
          variant="tonal"
          class="mr-4 rounded-lg text-none"
          @click="openDataDialog('import')"

        >
          Import CSV
        </v-btn>

        <v-btn 
          v-if="['schedules', 'programs'].includes(currentView)"
          color="primary"
          prepend-icon="mdi-plus" 
          variant="elevated" 
          class="mr-2 rounded-lg text-none"
          @click="openCreateForm"
        >
          Add {{ currentView === 'programs' ? 'Program' : 'Schedule' }}
        </v-btn>

        <v-btn to="/dashboard/schedules" variant="outlined" prepend-icon="mdi-calendar" color="primary">
          Back to Calendar
        </v-btn>
      </v-card-title>

      <v-data-table 
        :headers="activeHeaders"
        :items="displayedItems"
        :search="search"
        :loading="isLoading"
        class="elevation-0"
        v-if="isTableView"
      >
        <template v-slot:item.teacher_name="{ item }">
          <div class="d-flex align-center py-2">
            <span class="text-grey text-caption mr-2 font-weight-bold">#{{ item.teacher_id }}</span>
            <v-chip size="medium" variant="outlined" color="orange-lighten-2" class="font-weight-bold px-3">
              {{ item.teacher_name }}
            </v-chip>
          </div>
        </template>

        <!-- <template v-slot:item.date="{ value }">
          <div class="d-flex align-center font-weight-bold text-white">
            <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-calendar-month</v-icon>
            {{ formatDate(value) }}
          </div>
        </template> -->
        <template v-slot:item.date="{ item }">
  <div class="d-flex align-center font-weight-bold text-white">
    <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-calendar-month</v-icon>
    {{ item.date }}
  </div>
</template>

        <template v-slot:item.time_start="{ item }">
          <div class="d-flex align-center text-white">
            <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-clock-time-four-outline</v-icon>
            <span class="font-weight-bold">{{ item.time_start?.slice(0,5) }} — {{ item.time_end?.slice(0,5) }}</span>
          </div>
        </template>

        <template v-slot:item.program="{ item }">
          <div class="d-flex flex-column align-center py-1">
            <span class="text-orange-lighten-2 font-weight-bold text-subtitle-2" style="line-height: 1.2">
              {{ item.program }}
            </span>
            <span class="text-grey-lighten-1 text-caption">
              {{ item.module }}
            </span>
          </div>
        </template>

        <template v-slot:item.id="{ value }">
          <span class="text-white font-weight-medium">{{ value }}</span>
        </template>

        <template v-slot:item.students_name="{ value }">
          <div class="pa-2 bg-grey-darken-4 rounded border border-opacity-25 text-white text-caption" 
              style="min-width: 180px; max-width: 280px; line-height: 1.4">
            {{ value }}
          </div>
        </template>

        <template v-slot:item.summary="{ value }">
          <span class="text-white text-caption">{{ value || '---' }}</span>
        </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-center ga-1">
              <v-btn v-if="currentView === 'schedules'" icon="mdi-eye" size="x-small" variant="text" title="View in Calendar" color="info" @click="goToCalendar(item)"></v-btn>
              <v-btn v-if="currentView === 'schedules'" icon="mdi-pencil" size="x-small" variant="text" title="Edit Event" color="warning" @click="editSchedule(item)"></v-btn>
              <v-btn v-if="currentView === 'schedules'" icon="mdi-file-document-edit-outline" size="x-small" title="Reports" variant="text" :color="hasReport(item) ? 'grey' : 'success'" :disabled="hasReport(item)" @click="manageReport(item)" ></v-btn>
              <v-btn v-if="currentView === 'reports'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="editReport(item)"></v-btn>
              <v-btn v-if="currentView === 'users'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="editUser(item)"></v-btn>
            </div>
          </template>
      </v-data-table>

      <!-- <v-data-iterator
        :items="displayedItems"
        :search="search"
        :loading="isLoading"
        :headers="activeHeaders"
        class="bg-grey-darken-4 pa-4" 
        v-if="!isTableView"
      >
        <template v-slot:default="{ items }">
          <v-container>
            <v-card 
              v-for="item in items" 
              :key="item.raw.id" 
              class="mb-3 rounded-lg overflow-hidden bg-grey-darken-3" 
              elevation="1"
              border="b"
            >
              <v-row align="center" class="pa-4">
                <v-col cols="12" md="1" class="text-body-2 font-weight-medium">
                  {{ item.raw.sort_order }}
                </v-col>

                <v-col cols="12" md="1">
                  <v-avatar rounded="lg" size="48" class="bg-grey-lighten-3">
                    <v-img :src="item.raw.image_url || 'http://localhost:5000/uploads/placeholder-robot.png'"></v-img>
                  </v-avatar>
                </v-col>

                <v-col cols="12" md="2" class="text-subtitle-2 font-weight-bold">
                  {{ item.raw.title }}
                </v-col>

                <v-col cols="12" md="2" class="text-body-2 text-grey-darken-2">
                  {{ item.raw.age_range }}
                </v-col>

                <v-col cols="12" md="3" class="text-body-2 text-truncate text-grey-darken-1">
                  {{ item.raw.description }}
                </v-col>

                <v-col cols="12" md="1">
                  <v-chip
                    size="x-small"
                    :color="item.raw.is_active ? 'success' : 'error'"
                    variant="flat"
                    class="text-uppercase font-weight-bold"
                  >
                    {{ item.raw.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </v-col>

                <v-col cols="12" md="2" class="d-flex justify-center ga-2">
                  <v-btn 
                    size="small" 
                    variant="text" 
                    color="info" 
                    class="text-none"
                    @click="editProgram(item.raw)" 
                    title="Edit Program"
                  >
                    Edit  
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-container>
        </template>
      </v-data-iterator> -->
<v-data-iterator
        :items="displayedItems"
        :search="search"
        :loading="isLoading"
        :headers="activeHeaders"
        class="bg-grey-darken-4 pa-4" 
        v-if="!isTableView"
      >
        <template v-slot:default="{ items }">
          <v-container fluid class="pa-0">
            <v-card 
              v-for="item in items" 
              :key="item.raw.id" 
              class="mb-4 rounded-xl bg-grey-darken-3 border-thin" 
              elevation="2"
              hover
            >
              <div class="d-flex align-center pa-4 ga-4">
                <div class="text-h6 font-weight-bold text-grey-lighten-1 px-2" style="min-width: 40px">
                  {{ item.raw.sort_order ?? 0 }}
                </div>

                <v-avatar rounded="lg" size="64" class="bg-grey-darken-4 elevation-4 border border-opacity-25">
                  <!-- <v-img 
                    :src="item.raw.image_url ? `${config.public.apiBase}${item.raw.image_url}` : 'http://localhost:5000/uploads/placeholder-robot.png'"
                    cover
                  ></v-img> -->
                  <v-img :src="item.raw.image_url || 'http://localhost:5000/uploads/placeholder-robot.png'" cover ></v-img>
                </v-avatar>

                <div class="flex-grow-1" style="min-width: 150px">
                  <div class="text-h6 font-weight-bold text-white mb-n1">{{ item.raw.title }}</div>
                  <div class="text-caption font-weight-medium text-orange-lighten-2">
                    <v-icon size="x-small" class="mr-1">mdi-account-group</v-icon>
                    {{ item.raw.age_range }}
                  </div>
                </div>

                <div class="text-body-2 text-grey-lighten-1 text-truncate hidden-sm-and-down" style="max-width: 300px">
                  {{ item.raw.description }}
                </div>

                <div class="text-center px-4">
                  <v-chip
                    size="small"
                    :color="item.raw.is_active ? 'success' : 'error'"
                    variant="flat"
                    class="text-uppercase font-weight-black"
                  >
                    {{ item.raw.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>

                <div class="d-flex ga-2">
                  <v-btn 
                    variant="tonal" 
                    color="primary" 
                    rounded="lg"
                    class="text-none"
                    prepend-icon="mdi-pencil"
                    @click="editProgram(item.raw)" 
                  >
                    Edit  
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-container>
        </template>
      </v-data-iterator>
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
      { title: 'Sort Order', key: 'sort_order' },
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