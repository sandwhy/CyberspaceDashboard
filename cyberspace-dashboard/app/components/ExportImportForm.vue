<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:modelValue="$emit('update:modelValue', $event)" 
    max-width="1000px"
  >
    <v-card class="rounded-xl bg-grey-darken-3 text-white">
      <v-card-title class="pa-6 bg-grey-darken-4 d-flex align-center">
        <v-icon start :color="mode === 'export' ? 'success' : 'warning'">
          {{ mode === 'export' ? 'mdi-file-export' : 'mdi-file-import' }}
        </v-icon>
        <span class="text-h6 font-weight-bold">
          {{ mode === 'export' ? 'Export Full Data' : 'Import Data' }} - {{ viewName }}
        </span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <div v-if="mode === 'import'" class="mb-6">
          <div class="d-flex justify-end mb-2">
            <v-btn
              variant="text"
              size="x-small"
              color="blue-lighten-3"
              prepend-icon="mdi-download-box-outline"
              class="text-none"
              @click="downloadTemplate"
            >
              Download {{ viewName }} CSV Template
            </v-btn>
          </div>

          <div 
            class="pa-8 border-dashed rounded-lg text-center cursor-pointer hover-bg"
            @click="$refs.fileInput.click()"
            style="border-color: rgba(255,255,255,0.2) !important"
          > 
            <v-icon size="x-large" color="grey">mdi-cloud-upload</v-icon>
            <div class="text-body-1 mt-2">Click to select CSV file</div>
            <div class="text-caption text-grey">Headers must match the system properties</div>
            <input 
              type="file" 
              ref="fileInput" 
              hidden 
              accept=".csv" 
              @change="handleFileUpload"
            >
          </div>
        </div>

        <div v-if="mode === 'export'" class="mb-4">
          <v-text-field
            v-model="customFileName"
            label="Filename"
            persistent-placeholder
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-file-edit-outline"
            suffix=".csv"
            color="success"
            class="bg-grey-darken-4 rounded-lg"
          ></v-text-field>
        </div>

        <div class="text-subtitle-2 mb-2 text-grey-lighten-1">
          Previewing {{ previewItems.length }} records ({{ dynamicHeaders.length }} columns detected):
        </div>
        
        <v-table theme="dark" density="compact" class="rounded-lg border border-opacity-25" fixed-header height="400px">
          <thead>
            <tr>
              <th v-for="header in dynamicHeaders" :key="header.key" class="bg-grey-darken-4 text-grey-lighten-1 text-no-wrap">
                {{ header.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in previewItems" :key="index">
              <td v-for="header in dynamicHeaders" :key="header.key" class="text-no-wrap">
                <span class="text-caption">{{ item[header.key] ?? '—' }}</span>
              </td>
            </tr>
            <tr v-if="previewItems.length === 0">
              <td :colspan="dynamicHeaders.length" class="text-center pa-8 text-grey">
                No data available. {{ mode === 'import' ? 'Upload a file to preview.' : '' }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider class="border-opacity-25"></v-divider>

      <v-card-actions class="pa-6 bg-grey-darken-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        
        <v-btn 
          v-if="mode === 'export'"
          color="success" 
          variant="flat" 
          prepend-icon="mdi-download"
          :disabled="previewItems.length === 0"
          @click="runExport"
        >
          Download CSV
        </v-btn>

        <v-btn 
          v-else
          color="warning" 
          variant="flat" 
          prepend-icon="mdi-check"
          :disabled="previewItems.length === 0"
          @click="runImport"
        >
          Confirm Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  mode: String,
  headers: Array,
  items: Array,
  viewName: String,
  userName: String 
})

const emit = defineEmits(['update:modelValue', 'confirmed'])

const importPreviewData = ref([])
const fileInput = ref(null)
const customFileName = ref('')

// Initialize default filename for export
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.mode === 'export') {
    const date = new Date().toISOString().split('T')[0]
    customFileName.value = `${props.userName || 'User'}-${props.viewName}-${date}`
  }
})

/**
 * Helper: Formats snake_case keys into readable titles
 */
function formatTitle(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * DYNAMIC HEADER LOGIC
 * Extracts headers directly from the keys present in props.items.
 */
const dynamicHeaders = computed(() => {
  let sourceItem = null

  if (props.mode === 'import' && importPreviewData.value.length > 0) {
    sourceItem = importPreviewData.value[0]
  } else if (props.mode === 'export' && props.items && props.items.length > 0) {
    sourceItem = props.items[0]
  }

  if (sourceItem) {
    // Exclude 'actions' or other internal keys you don't want in a CSV
    return Object.keys(sourceItem)
      .filter(key => key !== 'actions')
      .map(key => ({
        title: formatTitle(key),
        key: key
      }))
  }

  // Fallback to original props headers if no data is present
  return (props.headers || []).filter(h => h.key !== 'actions')
})

const previewItems = computed(() => {
  return props.mode === 'export' ? props.items : importPreviewData.value
})

/**
 * TEMPLATE LOGIC: Generates a CSV with headers derived from data properties.
 */
function downloadTemplate() {
  const titles = dynamicHeaders.value.map(h => h.title)
  const csvContent = "\ufeff" + titles.join(',')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${props.viewName}_Template.csv`)
  link.click()
  
  URL.revokeObjectURL(url)
}

function runExport() {
  const keys = dynamicHeaders.value.map(h => h.key)
  const titles = dynamicHeaders.value.map(h => h.title)

  const rows = props.items.map(item => 
    keys.map(key => {
      let val = item[key] ?? ''
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    }).join(',')
  )

  const csvContent = "\ufeff" + [titles.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const finalName = `${customFileName.value || 'export'}.csv`

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", finalName) 
  link.click()
  
  emit('update:modelValue', false)
}

/**
 * IMPORT LOGIC: Updated to correctly handle commas inside quotes
 */
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    // Split by lines, but handle potential \r\n from Windows Excel       
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
    if (lines.length === 0) return

    // Helper regex to split by comma ONLY if the comma is not inside quotes
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/

    const csvHeaders = lines[0].split(csvSplitRegex).map(h => h.trim().replace(/"/g, ''))
    
    const parsed = lines.slice(1).map(line => {
      // Use the smart regex instead of simple .split(',')
      const values = line.split(csvSplitRegex)
      const obj = {}
      
      csvHeaders.forEach((headerTitle, i) => {
        const match = dynamicHeaders.value.find(h => h.title === headerTitle)
        const key = match ? match.key : headerTitle.toLowerCase().replace(/\s+/g, '_')
        
        // Clean up the value: remove surrounding quotes and trim whitespace
        let val = values[i] ? values[i].trim() : ''
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1)
        }
        // Handle escaped double quotes from Excel ( "" -> " )
        obj[key] = val.replace(/""/g, '"')
      })
      return obj
    })
    
    importPreviewData.value = parsed
  }
  reader.readAsText(file)
}

function runImport() {
  // Remove sensitive or database-generated keys before sending to backend
  const cleanedData = importPreviewData.value.map(item => {
    const { id, created_at, updated_at, ...cleaned } = item;
    return cleaned;
  });

  emit('confirmed', cleanedData);
  importPreviewData.value = [];
  emit('update:modelValue', false);
}
</script>

<style scoped>
  .hover-bg:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
</style>