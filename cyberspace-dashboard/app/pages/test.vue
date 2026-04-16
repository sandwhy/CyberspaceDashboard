<template>
  <ClientOnly>
  <v-container>
    <v-card class="pa-6 rounded-lg elevation-2 mb-6">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        The "Sandbox" Lab 🧪
      </v-card-title>
      
      <v-card-text>
        <div class="mb-8">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">1. Date & Time Utilities</h3>
          <div class="d-flex ga-4">
            <v-btn color="primary" @click="runLogTest">Log Timestamp</v-btn>
            <v-btn variant="outlined" color="secondary" @click="runDateUtilsTest">Test Formats</v-btn>
          </div>
        </div>

        <v-divider class="my-6"></v-divider>

          <div class="mb-8">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">2. Teacher Lookup (Autocomplete)</h3>
            
            <v-autocomplete
              chips
              label="Static Test (States)"
              :items="['California', 'Colorado', 'Florida']"
              class="mb-6"
            ></v-autocomplete>
            
            <v-autocomplete
              v-model="selectedTeacherId"
              :items="teacherList"
              item-title="username"
              item-value="id"
              label="Select a Staff Member"
              variant="outlined"
              prepend-inner-icon="mdi-account-search"
              :loading="isLoading"
              placeholder="Search by name..."
              class="mb-4"
              style="max-width: 450px;"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item 
                  v-bind="props" 
                  :subtitle="'Role: ' + (item?.role_name || 'N/A') + ' | DB ID: ' + (item?.id || '???')"
                ></v-list-item>
              </template>
            </v-autocomplete>

            <v-btn color="info" size="small" variant="tonal" @click="fetchTeachers" :loading="isLoading">
              Manual Refresh List
            </v-btn>
          </div>
        <v-divider class="my-6"></v-divider>

        <!-- TABLE -->
        <div class="mb-8">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">3. Simple Schedule Table</h3>
          <div class="d-flex ga-4 align-center mb-4 flex-wrap">
            <v-text-field
              v-model="search"
              label="Search current view..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 300px;"
            ></v-text-field>

            <v-spacer></v-spacer>

            <v-btn 
              color="success" 
              prepend-icon="mdi-file-export" 
              variant="tonal"
              @click="exportToCSV"
            >
              Export CSV
            </v-btn>

            <v-btn 
              color="warning" 
              prepend-icon="mdi-file-import" 
              variant="tonal"
              @click="$refs.fileInput.click()"
            >
              Import Schools
            </v-btn>

            <input 
              type="file" 
              ref="fileInput" 
              style="display: none" 
              accept=".csv" 
              @change="handleImport"
            >
          </div>
          <v-data-table
            :headers="tableHeaders"
            :items="filteredSchedules" 
            :loading="isLoading"
            density="compact"
            class="elevation-1 rounded-lg border"
          >
            <template v-slot:item.date="{ value }">
              <v-chip size="small" variant="tonal" color="primary">{{ value }}</v-chip>
            </template>

            <template v-slot:item.cycle="{ item }">
              <span class="text-caption font-weight-bold text-grey">Cycle {{ Math.ceil(item.id / 10) }}</span>
            </template>
          </v-data-table>
        </div>

        <v-divider class="my-6"></v-divider>

        <div>
          <h3 class="text-subtitle-2 font-weight-bold mb-2 text-primary">DEBUG OUTPUT:</h3>
          <div class="pa-4 bg-grey-darken-4 rounded border">
            <pre class="text-green-accent-3" style="font-family: monospace; white-space: pre-wrap; font-size: 0.9rem;">{{ testResult || 'Waiting for input...' }}</pre>
          </div>
        </div>
      </v-card-text>

      <v-data-iterator
        :items="activeItems"
        :search="search"
        :loading="isLoading"
        class="bg-grey-darken-3 pa-4" 
      >
        <template v-slot:default="{ items }">
          <v-container>
            <v-card 
              v-for="item in items" 
              :key="item.raw.id" 
              class="mb-3 rounded-lg overflow-hidden" 
              elevation="1"
              border="b"
            >
              <v-row align="center" class="pa-4">
                <v-col cols="12" md="1" class="text-body-2 font-weight-medium">
                  {{ item.raw.sort_order }}
                </v-col>

                <v-col cols="12" md="1">
                  <v-avatar rounded="lg" size="48" class="bg-grey-lighten-3">
                    <v-img :src="item.raw.image_url || '/placeholder-robot.png'"></v-img>
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
                  <v-btn size="small" variant="text" color="info" class="text-none">Edit</v-btn>
                  <v-btn size="small" variant="text" color="error" class="text-none">Delete</v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-container>
        </template>
      </v-data-iterator>
    </v-card>
  </v-container>
  
  </ClientOnly>
</template>

<script setup>
  definePageMeta({ layout: 'dashboards'})

  // --- SCHEDULE CONFIGURATION ---
  const scheduleHeaders = [
    { title: 'Session', key: 'program', align: 'start', width: '25%' },
    { title: 'Date', key: 'date', align: 'center' },
    { title: 'Time Window', key: 'time', align: 'center', sortable: false },
    { title: 'Teacher', key: 'teacher_name', align: 'start' },
    { title: 'Location', key: 'location', align: 'end' },
  ]

  const mockSchedules = ref([
    { 
      id: 1, program: 'mBot V2', date: '2026-04-10', 
      time_start: '09:00:00', time_end: '10:30:00', 
      teacher_name: 'Alex Johnson', location: 'Lab A' 
    },
    { 
      id: 2, program: 'Python AI', date: '2026-04-11', 
      time_start: '13:00:00', time_end: '14:30:00', 
      teacher_name: 'Sarah Smith', location: 'Online' 
    }
  ])

  // --- REPORT CONFIGURATION ---
  const reportHeaders = [
    { title: 'Module Name', key: 'module', align: 'start' },
    { title: 'Completion Date', key: 'date', align: 'center' },
    { title: 'Attendance', key: 'attendance', align: 'center' },
    { title: 'Review Status', key: 'status', align: 'center' },
    { title: 'Students', key: 'students_name', align: 'end' },
  ]

  const mockReports = ref([
    { 
      id: 101, module: 'Intro to Robotics', date: '2026-04-05', 
      attendance: 8, status: 'Verified', students_name: 'Budi, Ani, Cici...' 
    },
    { 
      id: 102, module: 'Variables & Loops', date: '2026-04-06', 
      attendance: 10, status: 'Pending', students_name: 'Doni, Eka, Fani...' 
    }
  ])


  const search = ref('') 

  // This computed property automatically updates whenever the user types in the search box
  const filteredSchedules = computed(() => {
    if (!search.value) return mockScheduleTable.value
    
    const s = search.value.toLowerCase()
    return mockScheduleTable.value.filter(item => 
      item.teacher_name.toLowerCase().includes(s) || 
      item.program.toLowerCase().includes(s) ||
      item.module.toLowerCase().includes(s) ||
      item.date.toLowerCase().includes(s) 
    )
  })

  const exportToCSV = () => {
    const data = filteredSchedules.value //filtered Still uses the filtered list from your search
    if (data.length === 0) return alert("No data to export!")

    // 1. Define ALL headers (including the hidden ones)
    const headers = [
      'ID', 'Date', 'Teacher ID', 'Teacher Name', 'Program', 'Module', 
      'Location', 'Start Time', 'End Time', 'Frequency', 'Repeat Until', 
      'Series ID', 'Color', 'Notes', 'Created By', 'Created At', 'Updated At', 'Cycle'
    ]
    
    // 2. Map the rows to include all properties from the data object
    const rows = data.map(item => [
      item.id,
      item.date,
      item.teacher_id,
      item.teacher_name,
      item.program,
      item.module,
      item.location,
      item.time_start,
      item.time_end,
      item.frequency || 'none',
      item.repeat_until || 'N/A',
      item.freq_id || 'N/A',
      item.color,
      `"${item.notes || ''}"`, // Wrap notes in quotes to handle commas inside text
      item.created_by,
      item.created_at,
      item.updated_at,
      `Cycle ${Math.ceil(item.id / 10)}` // Keeping your 10-meeting cycle logic
    ])

    // 3. Construct the CSV string with a BOM (Byte Order Mark) for Excel compatibility
    const csvContent = [
      headers.join(','), 
      ...rows.map(r => r.join(','))
    ].join('\n')

    // 4. Trigger the download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Full_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
    
    testResult.value = `SUCCESS: Exported ${data.length} rows with full metadata.`
  }

  const testResult = ref('')
  const teacherList = ref([])
  const selectedTeacherId = ref(null)
  const isLoading = ref(false)

  // Define the columns for our table
  const tableHeaders = [
    { title: 'ID', key: 'id', align: 'start', width: '50px' },
    { title: 'Date', key: 'date', sortable: true },
    { title: 'Teacher', key: 'teacher_name' },
    { title: 'Program', key: 'program' },
    { title: 'Module', key: 'module' },
    { title: 'Meetings', key: 'cycle', sortable: false }, // Placeholder for the "10 pertemuan" logic
  ]

  // Mock data representing a teacher's schedule series
  const mockScheduleTable = ref([
    { id: 1, date: '2026-04-10', teacher_name: 'Teacher A', program: 'mBot V2', module: 'Mechanics' },
    { id: 2, date: '2026-04-17', teacher_name: 'Teacher A', program: 'mBot V2', module: 'Coding 1' },
    { id: 3, date: '2026-04-24', teacher_name: 'Teacher A', program: 'mBot V2', module: 'Coding 2' },
    { id: 11, date: '2026-04-11', teacher_name: 'Teacher B', program: 'Python AI', module: 'Intro' },
    { id: 12, date: '2026-04-18', teacher_name: 'Teacher B', program: 'Python AI', module: 'Variables' },
  ])

  const runLogTest = () => { testResult.value = `Clicked: ${new Date().toLocaleTimeString()}` }

  const runDateUtilsTest = () => {
    const rawDate = new Date()
    testResult.value = `Formatted: ${formatDate(rawDate)}\nISO: ${toLocalISO(rawDate)}`
  }

  const fetchTeachers = async () => {
    isLoading.value = true
    const config = useRuntimeConfig()
    const token = useCookie('token').value

    try {
      const res = await fetch(`${config.public.apiBase}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      // Safety: filter out unregistered and ensure role_name exists
      teacherList.value = data.filter(u => u.role_name && u.role_name !== 'unregistered')
      console.log('whaaat:   ', teacherList.value)
      testResult.value = `API SUCCESS: Loaded ${teacherList.value.length} staff members.`
    } catch (err) {
      testResult.value = `API ERROR: ${err.message}`
    } finally {
      isLoading.value = false
    }
  }

  // SAFETY: Watcher with optional chaining
  watch(selectedTeacherId, (newId) => {
    if (newId) {
      const found = teacherList.value.find(t => t.id === newId)
      
      // If 'found' is undefined (e.g. list is refreshing), we stop here
      if (!found) return 

      testResult.value = [
        `--- Selection Detected ---`,
        `Name: ${found?.username}`,
        `ID:   ${found?.id}`,
        `Role: ${found?.role_name}`
      ].join('\n')
    }
  })

  const currentView = ref('programs') // Set to 'programs' to trigger the v-if

  // Mocking the proxy data you shared
  const activeItems = ref([
    {
      id: 5,
      title: "Python AI",
      age_range: "Ages 13+",
      description: "Deep dive into Artificial Intelligence and Machine Learning with Python.",
      image: "https://cdn.vuetifyjs.com/images/cards/foster.jpg", // Placeholder or your robot image
      active: 1
    },
    {
      id: 6,
      title: "mBot V2",
      age_range: "Ages 8-12",
      description: "Build and code your own robot. A hands-on journey into mechanics.",
      image: "https://cdn.vuetifyjs.com/images/cards/sunshine.jpg",
      active: 1
    },
    {
      id: 7,
      title: "mTiny",
      age_range: "Ages 4-6",
      description: "Screen-free coding experience designed for young children.",
      image: "https://cdn.vuetifyjs.com/images/cards/house.jpg",
      active: 0
    }
  ])

  onMounted(() => fetchTeachers())
</script>