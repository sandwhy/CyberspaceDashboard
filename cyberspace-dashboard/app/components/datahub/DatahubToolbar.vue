<template>
  <v-card-title class="d-flex align-center pa-6">
    <v-select
      :model-value="view"
      @update:model-value="$emit('update:view', $event)"
      :items="filteredOptions"
      label="View Data"
      variant="outlined"
      density="compact"
      hide-details
      class="mr-4"
      style="max-width: 160px"
      color="primary"
    ></v-select>
    
    <v-select
      :model-value="searchColumn"
      @update:model-value="$emit('update:searchColumn', $event)"
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
      :model-value="search"
      @update:model-value="$emit('update:search', $event)"
      prepend-inner-icon="mdi-magnify"
      :label="searchColumn === 'all' ? 'Search all fields' : `Search ${searchColumn}`"
      variant="solo"
      flat
      hide-details
      class="px-2"
    ></v-text-field>
    
    <v-spacer></v-spacer>

    <v-btn 
      v-if="['schedules', 'reports'].includes(view)"
      color="success" 
      prepend-icon="mdi-file-export" 
      variant="tonal"
      class="mr-2 rounded-lg text-none"
      @click="$emit('action', 'export')"
    >
      Export CSV
    </v-btn>

    <v-btn 
      v-if="['schedules'].includes(view) && canManageUsers"
      color="warning" 
      prepend-icon="mdi-file-import" 
      variant="tonal"
      class="mr-4 rounded-lg text-none"
      @click="$emit('action', 'import')"
    >
      Import CSV
    </v-btn>

    <v-btn 
      v-if="['schedules', 'programs'].includes(view)"
      color="primary"
      prepend-icon="mdi-plus" 
      variant="elevated" 
      class="mr-2 rounded-lg text-none"
      @click="$emit('action', 'create')"
    >
      Add {{ view === 'programs' ? 'Program' : 'Schedule' }}
    </v-btn>

    <v-btn to="/dashboard/schedules" variant="outlined" prepend-icon="mdi-calendar" color="primary">
      Back to Calendar
    </v-btn>
  </v-card-title>
</template>

<script setup>
defineProps({
  view: String,
  search: String,
  searchColumn: String,
  isTableView: Boolean,
  activeHeaders: Array,
  filteredOptions: Array,
  canManageUsers: Boolean
})
defineEmits(['update:view', 'update:search', 'update:searchColumn', 'action'])
</script>
