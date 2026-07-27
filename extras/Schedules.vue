<template>
  <div class="d-flex flex-column" style="height: 100vh; overflow: hidden;">
    <v-sheet class="d-flex align-center pa-2 border-b" tile style="height: 42pt">
      <v-btn variant="text" icon @click="$refs.calendar.prev()">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <v-btn 
        variant="elevated" 
        color="primary" 
        class="mr-2 text-none" 
        prepend-icon="mdi-calendar-today"
        @click="goToToday"
      >
        Today
      </v-btn>

      <v-menu v-model="datepickerOpen" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="outlined" class="mr-2">Date</v-btn>
        </template>
        <v-date-picker 
          v-model="pickedDate" 
          @update:model-value="onDatePicked"
        ></v-date-picker>
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
          @click="openEventDialog()"
        ></v-btn>

        <v-select
          v-model="type"
          :items="types"
          density="compact"
          variant="outlined"
          style="max-width: 110px;"
          hide-details
        ></v-select>
      </div>
    </v-sheet>

    <v-sheet class="overflow-auto" style="flex: 1; min-height: 0">
      <v-calendar
        ref="calendar"
        v-model="value"
        :type="type"
        :events="events"
        :weekdays="weekday"
        :first-interval="8"
        :interval-count="12"    
        :interval-height="70"    
        :event-ripple="true"
        event-border-radius="8"
        class="border-none"
        style="height: 100%"
        @click:event="showEventDetail"
      >
        <template #event="{ event }">
          <div class="pa-1 h-100 d-flex flex-column" style="font-size: 0.75rem; overflow: hidden;">
            <div class="d-flex align-center justify-space-between mb-1 opacity-80" style="font-size: 0.8rem;">
              <span class="font-weight-bold">
                {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
              </span>
              <v-icon size="x-small">mdi-clock-outline</v-icon>
            </div>

            <div class="text-truncate font-weight-black text-uppercase" style="letter-spacing: 0.5px; line-height: 1.1">
              {{ event.title }}
            </div>

            <v-spacer></v-spacer>

            <div class="d-flex align-center mt-1 pt-1 border-t-thin border-opacity-25">
              <v-avatar size="16" class="mr-1 bg-white-opacity-20">
                <v-icon size="10">mdi-account</v-icon>
              </v-avatar>
              <span class="text-truncate font-weight-medium">
                {{ event.teacher_name?.split(' ')[0] }}
              </span>
            </div>
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
      offset="5"
      location="end"
      @after-leave="selectedElement = null"
    >
      <v-card min-width="320px" class="rounded-lg elevation-8">
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
          <v-btn variant="tonal" size="small" color="warning" prepend-icon="mdi-pencil" @click="openEventDialog(null, { event: selectedEvent })">
            Edit Schedule
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="flat" size="small" color="primary" prepend-icon="mdi-file-document-edit" @click="openReportDialog(selectedEvent)">
            Report
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { formatTime, getTodayISO } from '~/utils/dateFormats' //

  // 1. COMPOSABLES & ROUTING
  definePageMeta({ layout: 'dashboards' })
  const route = useRoute()
  const { events, getEvents } = useSchedules() 

  // 2. CALENDAR & DATE STATE
  const calendar = ref(null)      // Reference for the $refs.calendar calls
  const value = ref(new Date())   // Standard Date object for v-model
  const type = ref('week')
  const types = ['month', 'week', 'day']
  const weekday = ref([1, 2, 3, 4, 5, 6, 0])
  
  const datepickerOpen = ref(false)
  const pickedDate = ref(new Date())

  // 3. INTERACTION STATE
  const editDialog = ref(false)
  const isEditMode = ref(false)
  const editedEvent = ref({})
  const reportDialogOpen = ref(false)
  const selectedEventForReport = ref({})
  const selectedOpen = ref(false)
  const selectedElement = ref(null)
  const selectedEvent = ref({})

  // 4. COMPUTED LABELS (Fixed to handle Date objects correctly)
  const currentMonthLabel = computed(() => {
    return new Date(value.value).toLocaleString('default', { month: 'long' })
  })

  const currentYear = computed(() => {
    return new Date(value.value).getFullYear()
  })

  // 5. METHODS
  function goToToday() { 
    value.value = new Date() 
  }

  // This handles the selection from the v-date-picker
  function onDatePicked(newDate) {
    if (!newDate) return
    value.value = new Date(newDate) // Sync calendar to picked date
    datepickerOpen.value = false    // Close the menu
  }

  function showEventDetail( nativeEvent, { event }) {
    // CRITICAL: Prevent the click from bubbling to the calendar background, 
    // which would immediately trigger a "close" on the menu.
    nativeEvent.stopPropagation()

    if (selectedOpen.value) {
      selectedOpen.value = false
      
      if (selectedEvent.value?.id === event.id) return
    }

    selectedEvent.value = event
    selectedElement.value = nativeEvent.target

    nextTick(() => {
      selectedOpen.value = true
    })
  }

  function openEventDialog(nativeEvent = null, { event } = { event: null }) {
    if (event && event.id) {
      isEditMode.value = true
      editedEvent.value = { ...event }
    } else {
      isEditMode.value = false
      editedEvent.value = { 
        date: getTodayISO(), 
        time_start: '09:00', 
        time_end: '10:30' 
      }
    }
    editDialog.value = true
    selectedOpen.value = false 
  }

  function openReportDialog(event) {
    selectedEventForReport.value = { ...event }
    reportDialogOpen.value = true
    selectedOpen.value = false
  }

  function getEventColor(event) {
    // Generate a consistent color based on teacher ID or Program if no color exists
    if (event.color) return event.color
    
    const colors = ['#5C6BC0', '#26A69A', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC']
    const index = (event.teacher_id || 0) % colors.length
    return colors[index]
  }

  // 6. LIFECYCLE
  onMounted(async () => {
    await getEvents()
    if (route.query.focus) {
      value.value = new Date(route.query.focus)
      type.value = 'day'
    }
  })
</script>