<template>
  <div class="d-flex flex-column" style="height: 100vh; overflow: hidden;">
    <v-sheet class="d-flex align-center pa-2 border-b" tile style="height: 42pt">
      <v-btn variant="text" icon @click="$refs.calendar.prev()">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <v-btn variant="outlined" class="mr-2" @click="goToToday">Today</v-btn>

      <v-menu v-model="datepickerOpen" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="outlined" class="mr-2">Date</v-btn>
        </template>
        <v-date-picker v-model="pickedDate" @update:model-value="onDatePicked" />
      </v-menu>

      <v-btn variant="text" icon @click="$refs.calendar.next()">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>

      <span class="text-h6 ml-4 font-weight-medium">
        {{ currentMonthLabel }} {{ currentYear }}
      </span>

     <v-spacer />
      <div class="d-flex align-center">
        <v-btn 
          icon="mdi-plus" 
          variant="tonal" 
          size="small"
          class="mr-6"
          @click="openEventDialog"
        ></v-btn>

        <v-select
          v-model="type"
          :items="types"
          density="compact"
          variant="outlined"
          style="max-width: 110px;"
        ></v-select>
      </div>
    </v-sheet>

    <v-sheet class="overflow-auto" style="flex: 1; min-height: 0">
      <v-calendar
        ref="calendar"
        v-model="value"
        :now="new Date().toISOString().split('T')[0]"
        :type="type"
        :events="events"
        :view-mode="type"
        :weekdays="weekday"
        :first-interval="8"
        :interval-count="12"    
        :interval-height="60"    
        :event-color="getEventColor"
        @mouseenter:event="handleHover"
        @click:date="viewDay"
        @click:more="viewDay"
        class="border"
        style="height: 100%"
      >
        <template #event="{ event }">
          <div class="pa-2 px-2 py-1 d-flex flex-column" style="font-size: 0.85rem; line-height: 1.2;">
            <div class="text-caption font-weight-light" style="font-size: 0.7rem;">
              {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
            </div>
            <v-divider class="my-1" thickness="1" color="white"></v-divider>
            <div class="font-weight-bold text-truncate">Teacher: {{ event.teacher_name }}</div>
            <div class="text-truncate">{{ event.title }}</div>
          </div>
        </template>   
      </v-calendar>
    </v-sheet>

    <ScheduleForm 
      v-model="editDialog" 
      :is-edit="isEditMode" 
      :event-data="editedEvent" 
      @saved="getEvents" 
      @deleted="getEvents" 
    />

    <ReportForm 
      v-model="reportDialogOpen" 
      :is-edit="false" 
      :report-data="selectedEventForReport" 
      @saved="getEvents"
    />

    <v-menu
      v-model="selectedOpen"
      :activator="selectedElement"
      :close-on-content-click="false"
      open-on-hover
      :close-delay="300" 
      offset="5"
      location="end"
    >
      <v-card min-width="320px" class="rounded-lg elevation-8" @mouseenter="selectedOpen = true">
        <div 
          :style="{ backgroundColor: selectedEvent?.color || '#666' }" 
          class="px-4 py-3 d-flex align-center justify-space-between text-white"
        >
          <div class="text-subtitle-1 font-weight-bold text-truncate">
            {{ selectedEvent?.title || 'Loading...' }}
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="selectedOpen = false"></v-btn>
        </div>

        <v-card-text class="pa-4 bg-grey-lighten-4">
          <div class="d-flex align-center mb-2">
            <v-icon start size="small" color="primary">mdi-map-marker</v-icon>
            <span class="text-body-2 ml-2">{{ selectedEvent?.location || 'No location set' }}</span>
          </div>
          <div class="d-flex align-center mb-2">
            <v-icon start size="small" color="primary">mdi-account-tie</v-icon>
            <span class="text-body-2 ml-2">Teacher: {{ selectedEvent?.teacher_name || 'N/A' }}</span>
          </div>
          
          <v-divider class="my-3"></v-divider>

          <div class="text-caption text-grey-darken-1 italic">
            {{ selectedEvent?.notes || 'No additional notes.' }}
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-white">
          <v-btn 
            variant="tonal" 
            size="small" 
            color="warning" 
            prepend-icon="mdi-pencil"
            @click="openEventDialog(null, { event: selectedEvent })"
          >
            Edit Schedule
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn 
            variant="flat" 
            size="small" 
            color="primary" 
            prepend-icon="mdi-file-document-edit"
            @click="openReportDialog(selectedEvent)"
          >
            Report
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
  // 1. Logic Imports
  definePageMeta({
    layout: 'dashboards',
  })

  import { ref, onMounted, computed, watch } from 'vue'
  import { useRoute } from 'vue-router' // 1. Import useRoute

  const route = useRoute()
  const { events, getEvents } = useSchedules() // From our new Composable!
  
  // 2. Component State (UI only)
  const type = ref('week')
  const types = ['month', 'week', 'day']
  const weekday = ref([1, 2, 3, 4, 5, 6, 0]) // Mon-Sun
  const value = ref(new Date())
  const editDialog = ref(false)
  const isEditMode = ref(false)
  const editedEvent = ref({})
  const selectedOpen = ref(false)
  const selectedElement = ref(null)
  const selectedEvent = ref({}) // 1. ADD THIS: Holds the data for the tooltip
  const reportDialogOpen = ref(false)
  const selectedEventForReport = ref({})

  const goToToday = () => { value.value = new Date() }

  function openEventDialog(nativeEvent = null, { event } = { event: null }) {
    if (event && event.id) {
      isEditMode.value = true
      editedEvent.value = { ...event }
    } else {
      isEditMode.value = false
      editedEvent.value = { date: getTodayISO(), time_start: '09:00', time_end: '10:30' }
    }
    
    editDialog.value = true
    selectedOpen.value = false // Close the hover menu so it doesn't block the form
  }

  // function showEvent(nativeEvent, { event }) {
  //   const open = () => {
  //     selectedEvent.value = event
  //     selectedElement.value = nativeEvent.target
  //     requestAnimationFrame(() => requestAnimationFrame(() => selectedOpen.value = true))
  //   }
  //   if (selectedOpen.value) {
  //     selectedOpen.value = false
  //     requestAnimationFrame(() => requestAnimationFrame(() => open()))
  //   } else {
  //     open()
  //   }
  //   nativeEvent.stopPropagation()
  // }

  function openReportDialog(event) {
    selectedEventForReport.value = { ...event } // Pass the full event from the hover menu
    reportDialogOpen.value = true
    selectedOpen.value = false // Close the hover menu
  }

  // 1. Update handleHover to actually set the data
  function handleHover(nativeEvent, { event }) {
    // if (type.value !== 'month') return
    console.log('helo')
    selectedEvent.value = event // Now the tooltip shows the right info!
    selectedElement.value = nativeEvent.target
    selectedOpen.value = true
  }

  onMounted(async () => {
  await getEvents() // Fetch your data first
  if (route.query.focus) {

    value.value = new Date(route.query.focus)

    type.value = 'day'
  }
})
</script>