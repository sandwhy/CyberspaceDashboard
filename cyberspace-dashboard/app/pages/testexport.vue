<template>
  <ClientOnly>
  <v-container class="fill-height bg-grey-darken-4 d-flex align-center justify-center">
    <v-card class="pa-10 bg-grey-darken-3 rounded-xl text-center" width="500">
      <h2 class="text-h4 font-weight-black mb-6 text-white">Action Lab 🧪</h2>
      
      <div class="d-flex flex-column ga-4">
        <v-btn 
          color="success" 
          size="large" 
          prepend-icon="mdi-file-export"
          @click="triggerAction('export')"
        >
          Test Export Preview
        </v-btn>

        <v-btn 
          color="warning" 
          size="large" 
          prepend-icon="mdi-file-import"
          @click="triggerAction('import')"
        >
          Test Import Parser
        </v-btn>
      </div>

      <div class="mt-6 text-caption text-grey">
        Dialog Status: {{ testOpen ? '🟢 OPEN' : '🔴 CLOSED' }}
      </div>
    </v-card>

    <ExportImportDialog 
      v-model="testOpen"
      :mode="testMode"
      :headers="mockHeaders"
      :items="mockItems"
      view-name="Schedules"
      @confirmed="onImportConfirm"
    />
  </v-container>
  </ClientOnly>
</template>

<script setup>
// 1. STATE CONTROLS
const testOpen = ref(false)
const testMode = ref('export')

// 2. MOCK DATA (Simulating what Datahub usually sends)
const mockHeaders = [
  { title: 'Teacher', key: 'teacher_name' },
  { title: 'Date', key: 'date' },
  { title: 'Program', key: 'program' },
  { title: 'Location', key: 'location' }
]

const mockItems = [
  { teacher_name: 'Alex Johnson', date: '2026-04-10', program: 'mBot V2', location: 'Lab A' },
  { teacher_name: 'Sarah Smith', date: '2026-04-11', program: 'Python AI', location: 'Online' },
  { teacher_name: 'Budi Hartono', date: '2026-04-12', program: 'Robotics', location: 'Room 302' }
]

// 3. HANDLERS
function triggerAction(mode) {
  testMode.value = mode
  testOpen.value = true // This triggers the v-model opening
}

function onImportConfirm(data) {
  console.log("Import data received by parent:", data)
  alert(`Parent received ${data.length} rows. Ready for API call!`)
  testOpen.value = false
}
</script>