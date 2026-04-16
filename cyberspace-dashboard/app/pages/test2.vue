<template>
  <v-container fluid class="bg-grey-darken-4 min-vh-100 pa-4">
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10">
        <v-card class="pa-4 rounded-xl mb-6 bg-grey-darken-3 border border-opacity-25" theme="dark">
          <div class="d-flex align-center flex-wrap ga-4">
            <h2 class="text-h5 font-weight-black text-orange-lighten-2">Design Lab 🧪</h2>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search records..."
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 350px"
              color="orange-lighten-2"
            ></v-text-field>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <ClientOnly>
      <v-row justify="center">
        <v-col cols="12" md="11" lg="10">
          <v-card theme="dark" variant="flat" class="rounded-xl overflow-hidden border border-opacity-25 mb-8 bg-grey-darken-3">
            <v-card-title class="pa-4 bg-grey-darken-4 d-flex align-center border-b border-opacity-25">
              <v-icon start color="orange-lighten-2">mdi-calendar-clock</v-icon>
              <span class="text-subtitle-1 font-weight-bold">Live Schedules</span>
            </v-card-title>
            
            <v-data-table :headers="scheduleHeaders" :items="filteredSchedules" density="comfortable" hover class="bg-transparent">
              <template v-slot:item.teacher_name="{ item }">
                <div class="d-flex align-center">
                  <span class="text-grey text-caption mr-2" style="min-width: 20px">#{{ item.teacher_id }}</span>
                  <v-chip size="medium" variant="outlined" color="orange-lighten-2" class="font-weight-bold">{{ item.teacher_name }}</v-chip>
                </div>
              </template>

              <template v-slot:item.date="{ value }">
                <div class="d-flex align-center font-weight-bold">
                  <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-calendar</v-icon>
                  {{ value }}
                </div>
              </template>

              <template v-slot:item.time_start="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-clock-outline</v-icon>
                  <span class="text-body-2 font-weight-bold">{{ item.time_start.slice(0,5) }} — {{ item.time_end.slice(0,5) }}</span>
                </div>
              </template>

              <template v-slot:item.program="{ item }">
                <div class="d-flex flex-column align-center py-2">
                  <span class="text-subtitle-2 font-weight-bold text-orange-lighten-2" style="line-height: 1.2">{{ item.program }}</span>
                  <span class="text-caption text-grey">{{ item.module }}</span>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <v-col cols="12" md="11" lg="10">
          <v-card theme="dark" variant="flat" class="rounded-xl overflow-hidden border border-opacity-25 bg-grey-darken-3">
            <v-card-title class="pa-4 bg-grey-darken-4 d-flex align-center border-b border-opacity-25">
              <v-icon start color="orange-lighten-2">mdi-file-check</v-icon>
              <span class="text-subtitle-1 font-weight-bold">Verified Reports</span>
            </v-card-title>
            
            <v-data-table :headers="reportHeaders" :items="filteredReports" density="compact" hover class="bg-transparent">
              <template v-slot:item.teacher_name="{ item }">
                <div class="d-flex align-center">
                  <span class="text-grey text-caption mr-2">#{{ item.teacher_id }}</span>
                  <span class="text-body-2 font-weight-medium">{{ item.teacher_name }}</span>
                </div>
              </template>

              <template v-slot:item.date="{ value }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-calendar</v-icon>
                  <span class="text-caption font-weight-bold">{{ value }}</span>
                </div>
              </template>

              <template v-slot:item.total_student_attendance="{ item }">
                <div class="d-flex flex-column" style="width: 120px">
                  <div class="d-flex align-center mb-1">
                    <v-icon size="x-small" color="orange-lighten-2" class="mr-1">mdi-clock</v-icon>
                    <span class="text-overline" style="font-size: 8px !important;">{{ item.time_start.slice(0,5) }}-{{ item.time_end.slice(0,5) }}</span>
                  </div>
                  <v-progress-linear :model-value="(item.total_student_attendance / 15) * 100" color="orange-lighten-2" height="12" rounded>
                    <template v-slot:default><span class="text-overline font-weight-black" style="font-size: 9px !important;">{{ item.total_student_attendance }}/15</span></template>
                  </v-progress-linear>
                </div>
              </template>

              <template v-slot:item.students_name="{ value }">
                <div class="pa-2 bg-grey-darken-4 rounded border border-opacity-25 text-caption text-grey-lighten-1" style="max-width: 250px; line-height: 1.4">
                  {{ value }}
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </ClientOnly>
  </v-container>
</template>

<script setup>
  definePageMeta({ layout: 'dashboards' })

  const search = ref('')

  // --- HEADERS (With Teacher ID left of Teacher) ---
  const scheduleHeaders = [
    { title: 'Teacher Name', key: 'teacher_name', align: 'start' },
    { title: 'Date', key: 'date', align: 'start' },
    { title: 'Start - End Time', key: 'time_start', align: 'start', sortable: false },
    { title: 'Program / Module', key: 'program', align: 'center' },
    { title: 'Location', key: 'location', align: 'end' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
  ]

  const reportHeaders = [
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Teacher', key: 'teacher_name', align: 'start' },
    { title: 'Date', key: 'date', align: 'start' },
    { title: 'Attendance & Time', key: 'total_student_attendance', align: 'center' },
    { title: 'Program / Module', key: 'program', align: 'center' },
    { title: 'Students List', key: 'students_name', align: 'start' },
    { title: 'Notes', key: 'notes', align: 'end' },
  ]

  // --- MOCK DATA ---
  const mockSchedules = ref([
    { 
      id: 1, teacher_id: 3, teacher_name: 'Alex Johnson', date: '2026-04-10', 
      time_start: '09:00:00', time_end: '10:30:00', 
      program: 'mBot V2', module: 'Mechanics', location: 'Lab A' 
    },
    { 
      id: 2, teacher_id: 5, teacher_name: 'Sarah Smith', date: '2026-04-11', 
      time_start: '13:00:00', time_end: '14:30:00', 
      program: 'Python AI', module: 'Variables', location: 'Online' 
    }
  ])

  const mockReports = ref([
    { 
      id: 101, teacher_id: 3, teacher_name: 'Alex Johnson', date: '2026-04-05', 
      time_start: '09:00:00', time_end: '10:30:00',
      program: 'mBot V2', module: 'Intro', 
      total_student_attendance: 2, students_name: 'Budi, Ani', 
      notes: 'Initial build complete' 
    },
    { 
      id: 102, teacher_id: 5, teacher_name: 'Sarah Smith', date: '2026-04-06', 
      time_start: '14:00:00', time_end: '15:30:00',
      program: 'Python AI', module: 'Loops', 
      total_student_attendance: 5, students_name: 'Doni, Eka, Fani, Gani, Hani', 
      notes: 'All understood for loops' 
    }
  ])

  // --- POWER SEARCH ---
  const filteredSchedules = computed(() => {
    const s = search.value.toLowerCase()
    return mockSchedules.value.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(s))
    )
  })

  const filteredReports = computed(() => {
    const s = search.value.toLowerCase()
    return mockReports.value.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(s))
    )
  })
</script>