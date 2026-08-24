<template>
  <v-data-table 
    :headers="headers"
    :items="items"
    :search="search"
    :loading="isLoading"
    class="elevation-0"
  >
  <!-- ### Schedules table -->
    <template v-slot:item.teacher_name="{ item }">
      <div class="d-flex align-center py-2">
        <span class="text-grey text-caption mr-2 font-weight-bold">#{{ item.teacher_id }}</span>
        <v-chip size="medium" variant="outlined" color="orange-lighten-2" class="font-weight-bold px-3">
          {{ item.teacher_name }}
        </v-chip>
      </div>
    </template>
  <!-- ### Assignments table -->
    <template v-slot:item.assigned_teachers="{ item }">
      <div 
        v-if="item.assigned_teachers" 
        class="d-flex ga-1 py-1 overflow-x-auto custom-scrollbar" 
        style="max-width: 250px;" 
      >
        <v-chip 
          v-for="(teacher, idx) in item.assigned_teachers.split(',')" 
          :key="idx" 
          size="small" 
          color="info" 
          variant="outlined"
          class="font-weight-medium flex-shrink-0"
        >
          {{ teacher.trim() }}
        </v-chip>
      </div>
      <span v-else class="text-grey text-caption font-italic">Unassigned</span>
    </template>

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
  <!-- Programs table -->
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
    
    <!-- lessons columns -->
    <template v-slot:item.lessons_count="{ item }">
      <div class="d-flex align-center font-weight-bold text-white">
        <v-icon size="small" color="orange-lighten-2" class="mr-2">mdi-book-open-variant</v-icon>
        {{ item.lessons_count || 0 }}
      </div>
    </template>
    <template v-slot:item.status="{ item }">
      <v-chip :color="getStatusColor(item.status)" size="small" class="text-uppercase font-weight-bold">
        {{ item.status || 'draft' }}
      </v-chip>
    </template>

    <template v-slot:item.teachers="{ item }">

      <div v-if="item.teachers && item.teachers.length > 0" class="d-flex flex-wrap ga-1 py-1">
        <v-chip 
          v-for="teacher in item.teachers" 
          :key="teacher.id" 
          size="small" 
          color="info" 
          variant="outlined"
        >
          {{ teacher.username || teacher.name }}
        </v-chip>
      </div>
      <span v-else class="text-grey text-caption font-italic">Unassigned</span>
    </template>

    <template v-slot:item.actions="{ item }">
      <div class="d-flex justify-center ga-1">
        <v-btn v-if="currentView === 'schedules'" icon="mdi-eye" size="x-small" variant="text" title="View in Calendar" color="info" @click="$emit('go-to-calendar', item)"></v-btn>
        <v-btn v-if="currentView === 'schedules'" icon="mdi-pencil" size="x-small" variant="text" title="Edit Event" color="warning" @click="$emit('edit-schedule', item)"></v-btn>
        <v-btn v-if="currentView === 'schedules'" icon="mdi-file-document-edit-outline" size="x-small" title="Reports" variant="text" :color="hasReport(item) ? 'grey' : 'success'" :disabled="hasReport(item)" @click="$emit('manage-report', item)" ></v-btn>
       
        <v-btn v-if="currentView === 'reports'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="$emit('edit-report', item)"></v-btn>
        <v-btn v-if="currentView === 'users'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="$emit('edit-user', item)"></v-btn>
        
        <v-btn
          v-bind="props"
          icon="mdi-account-edit"
          size="small"
          variant="text"
          color="primary"
          @click="$emit('edit-program-assignment', item)"
        ></v-btn>

        <v-btn 
          v-if="currentView === 'lessonsAssignment'" 
          icon="mdi-book-plus-multiple" 
          size="x-small" 
          variant="text" 
          title="Create Lessons" 
          color="success" 
          @click="$emit('go-to-lessons', item)"
        ></v-btn>
        
      </div>
    </template>
  </v-data-table>
</template>

<script setup>
  const props = defineProps({
    headers: Array,
    items: Array,
    search: String,
    isLoading: Boolean,
    currentView: String,
    reports: {
      type: Array,
      default: () => []
    }
  })

  // console.log('here')
  // console.log(items)
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'draft': default: return 'grey'
  }
}
  defineEmits(['go-to-calendar', 'edit-schedule', 'manage-report', 'edit-report', 'edit-user', 'edit-program-assignment', 'go-to-lessons'])

  function hasReport(schedule) {
    return props.reports.some(r => r.schedule_id === schedule.id)
  }
</script>

<style scoped>
/* Firefox support */
.custom-scrollbar {
  scrollbar-width: thin; /* Forces a thinner scrollbar */
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent; /* thumb color | track color */
}

/* WebKit (Chrome, Edge, Safari) */
.custom-scrollbar::-webkit-scrollbar {
  height: 4px; /* Makes the horizontal scrollbar very thin */
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; /* Hides the bulky track */
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2); /* Subtle, semi-transparent grey/white */
  border-radius: 10px; /* Soft rounded edges */
}

/* Optional: Make it slightly brighter when the user hovers over it */
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
