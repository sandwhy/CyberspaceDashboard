<template>
  <v-data-table 
    :headers="headers"
    :items="items"
    :search="search"
    :loading="isLoading"
    class="elevation-0"
  >
    <template v-slot:item.teacher_name="{ item }">
      <div class="d-flex align-center py-2">
        <span class="text-grey text-caption mr-2 font-weight-bold">#{{ item.teacher_id }}</span>
        <v-chip size="medium" variant="outlined" color="orange-lighten-2" class="font-weight-bold px-3">
          {{ item.teacher_name }}
        </v-chip>
      </div>
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
        <v-btn v-if="currentView === 'schedules'" icon="mdi-eye" size="x-small" variant="text" title="View in Calendar" color="info" @click="$emit('go-to-calendar', item)"></v-btn>
        <v-btn v-if="currentView === 'schedules'" icon="mdi-pencil" size="x-small" variant="text" title="Edit Event" color="warning" @click="$emit('edit-schedule', item)"></v-btn>
        <v-btn v-if="currentView === 'schedules'" icon="mdi-file-document-edit-outline" size="x-small" title="Reports" variant="text" :color="hasReport(item) ? 'grey' : 'success'" :disabled="hasReport(item)" @click="$emit('manage-report', item)" ></v-btn>
        <v-btn v-if="currentView === 'reports'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="$emit('edit-report', item)"></v-btn>
        <v-btn v-if="currentView === 'users'" icon="mdi-pencil" size="x-small" variant="text" color="warning" @click="$emit('edit-user', item)"></v-btn>
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

  defineEmits(['go-to-calendar', 'edit-schedule', 'manage-report', 'edit-report', 'edit-user'])

  function hasReport(schedule) {
    return props.reports.some(r => r.schedule_id === schedule.id)
  }
</script>
