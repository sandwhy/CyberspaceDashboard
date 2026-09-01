<template>
  <v-container fluid class="pa-0 h-100">
    <v-row no-gutters class="h-100">
      
      <v-col cols="12" md="4" lg="3" class="border-e bg-surface d-flex flex-column taskbar-col">
        <div class="pa-4 border-b">
          <div class="text-caption text-uppercase font-weight-bold text-grey mb-1">Selected Program</div>
          <v-select
            v-model="selectedProgramId"
            :items="dataStore.programs"
            item-title="title"
            item-value="id"
            label="Choose Program"
            variant="outlined"
            density="compact"
            class="mb-2"
            :loading="isLoadingLessons"
            @update:model-value="onProgramChange"
          />

          <!-- Program Status 3-Type Toggle under Selected Program -->
          <v-select
            v-if="selectedProgram"
            v-model="selectedProgram.lesson_status"
            :items="[
              { title: 'Draft', value: 'draft' },
              { title: 'Active', value: 'active' },
              { title: 'Inactive', value: 'inactive' }
            ]"
            label="Program Status *"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="saveProgramStatus"
          />
        </div>

        <div class="pa-2 border-b overflow-y-auto" style="max-height: 40%;">
          <div class="d-flex align-center justify-space-between px-2 mb-2">
            <span class="text-caption text-uppercase font-weight-bold text-grey">Lessons List</span>
            <v-chip size="x-small" color="primary" variant="flat">{{ filteredLessons.length }}</v-chip>
          </div>
          
          <v-list density="compact" nav class="pa-0">
            <v-list-item
              v-for="(lesson, index) in filteredLessons"
              :key="lesson.id || index"
              :active="activeLessonIndex === index"
              color="primary"
              rounded="lg"
              class="mb-1"
              @click="selectLesson(index)"
            >
              <template #prepend>
                <v-avatar size="24" color="grey-lighten-3" class="text-caption font-weight-bold mr-2">
                  {{ lesson.sequence_order || index + 1 }}
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ lesson.title || 'Untitled Lesson' }}
              </v-list-item-title>

              <v-list-item-subtitle class="d-flex align-center ga-2 mt-1">
                <span class="text-capitalize">{{ lesson.type || 'document' }}</span>
              </v-list-item-subtitle>
            </v-list-item>

            <div v-if="!isLoadingLessons && !filteredLessons.length" class="text-caption text-grey text-center py-4">
              No lessons found for this program.
            </div>
          </v-list>
        </div>

        <div v-if="activeLesson" class="pa-4 flex-grow-1 border-b overflow-y-auto">
          <div class="text-caption text-uppercase font-weight-bold text-grey mb-3">Lesson Settings</div>

          <v-text-field
            v-model="activeLesson.title"
            label="Lesson Title *"
            variant="outlined"
            density="compact"
            class="mb-2"
          />

          <v-select
            v-model="activeLesson.type"
            :items="[
              { title: 'Document (PDF)', value: 'document' },
              { title: 'Video Stream', value: 'video' },
              { title: 'Quiz (JSON)', value: 'quiz' }
            ]"
            label="Format Type *"
            variant="outlined"
            density="compact"
            class="mb-2"
          />

          <v-text-field
            v-model.number="activeLesson.sequence_order"
            type="number"
            label="Sequence Order"
            variant="outlined"
            density="compact"
            class="mb-2"
          />

          <v-btn
            block
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete-outline"
            class="mt-4"
            @click="confirmDeleteLesson"
          >
            Delete Lesson
          </v-btn>
        </div>

        <div class="pa-4 bg-surface mt-auto">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-plus"
            variant="flat"
            @click="quickCreateNext"
          >
            Quick Create Next
          </v-btn>
        </div>
      </v-col>

      <v-col cols="12" md="8" lg="9" class="pa-6 bg-grey-lighten-4 overflow-y-auto editing-col">
        <v-card v-if="activeLesson" flat class="rounded-lg pa-6 border">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-h6 font-weight-bold">
                {{ activeLesson.title || 'Untitled Lesson' }}
              </div>
              <div class="text-caption text-grey">
                Program: <strong>{{ activeLesson.program_title || 'N/A' }}</strong> | 
                Format: <strong class="text-uppercase">{{ activeLesson.type || 'document' }}</strong> | 
                Sequence: #{{ activeLesson.sequence_order }}
              </div>
            </div>

            <v-btn color="primary" class="px-6" :loading="isSaving" @click="saveLesson">
              Save Lesson
            </v-btn>
          </div>

          <v-divider class="mb-6" />

          <div v-if="activeLesson.type === 'document' || !activeLesson.type">
            <div class="text-subtitle-2 font-weight-bold mb-2">PDF Document Content</div>
            <v-file-input
              v-model="pdfFile"
              accept="application/pdf"
              label="Upload PDF Document"
              prepend-icon="mdi-file-pdf-box"
              variant="outlined"
              density="compact"
            />
            <div v-if="activeLesson.data" class="text-caption text-grey mt-2">
              Current File Path: <code>{{ activeLesson.data }}</code>
            </div>
          </div>

          <div v-else-if="activeLesson.type === 'video'">
            <div class="text-subtitle-2 font-weight-bold mb-2">Video Resource</div>
            <v-text-field
              v-model="activeLesson.data"
              label="YouTube / Stream URL"
              placeholder="https://..."
              variant="outlined"
              density="compact"
            />
          </div>

          <div v-else-if="activeLesson.type === 'quiz'">
            <QuizBuilder v-model="activeLesson.data" />
          </div>
        </v-card>

        <v-card v-else flat class="rounded-lg pa-12 text-center border">
          <v-icon size="48" color="grey">mdi-book-open-page-variant-outline</v-icon>
          <div class="text-body-1 text-grey mt-2">
            Select a program to load its lessons or click <strong>Quick Create Next</strong>.
          </div>
        </v-card>
      </v-col>

    </v-row>

    <!-- Delete Lesson Confirmation Dialog -->
    <v-dialog v-model="deleteLessonDialog" max-width="400px">
      <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">Delete Lesson?</v-card-title>
        <v-card-text>Are you sure you want to delete this lesson? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteLessonDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="executeDeleteLesson">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'dashboards'
})

import { useRoute } from 'vue-router'
const route = useRoute()

const dataStore = useDataStore()
const config = useRuntimeConfig()

const selectedProgramId = ref(null)
const activeLessonIndex = ref(0)
const filteredLessons = ref([])
const pdfFile = ref(null)
const isLoadingLessons = ref(false)
const isSaving = ref(false)
const deleteLessonDialog = ref(false)

const selectedProgram = computed(() => {
  return dataStore.programs.find(p => p.id === selectedProgramId.value) || null
})

const activeLesson = computed(() => {
  return filteredLessons.value[activeLessonIndex.value] || null
})

const fetchLessonsForProgram = async (programId) => {
  if (!programId) return
  isLoadingLessons.value = true
  
  try {
    const token = useCookie('token').value
    const res = await fetch(`${config.public.apiBase}/api/lessons?program_id=${programId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const rawData = await res.json()
    filteredLessons.value = Array.isArray(rawData) ? rawData : (rawData.data || [])
    activeLessonIndex.value = 0
  } catch (err) {
    console.error('Failed to fetch lessons:', err)
  } finally {
    isLoadingLessons.value = false
  }
}

const onProgramChange = (programId) => {
  pdfFile.value = null
  fetchLessonsForProgram(programId)
}

const saveProgramStatus = async (newStatus) => {
  if (!selectedProgramId.value) return
  const token = useCookie('token').value
  try {
    const response = await fetch(`${config.public.apiBase}/api/programs/${selectedProgram.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ lesson_status: newStatus })
    })
    
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Failed to update program status')
  } catch (err) {
    console.error('Error updating program status:', err.message)
  }
}

const selectLesson = (index) => {
  activeLessonIndex.value = index
  pdfFile.value = null
}

const quickCreateNext = () => {
  const nextOrder = filteredLessons.value.length + 1
  const selectedProg = selectedProgram.value

  const newLesson = {
    program_id: selectedProgramId.value,
    program_title: selectedProg ? selectedProg.title : '',
    title: `Lesson ${nextOrder}`,
    type: 'document',
    data: '',
    sequence_order: nextOrder
  }

  filteredLessons.value.push(newLesson)
  activeLessonIndex.value = filteredLessons.value.length - 1
  pdfFile.value = null
}

const confirmDeleteLesson = () => {
  if (!activeLesson.value) return
  deleteLessonDialog.value = true
}

const executeDeleteLesson = async () => {
  if (!activeLesson.value) return
  const token = useCookie('token').value
  try {
    if (activeLesson.value.id) {
      const response = await fetch(`${config.public.apiBase}/api/lessons/${activeLesson.value.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Delete failed')
    }

    const index = activeLessonIndex.value
    filteredLessons.value.splice(index, 1)
    deleteLessonDialog.value = false

    if (filteredLessons.value.length > 0) {
      activeLessonIndex.value = Math.max(0, index - 1)
    } else {
      activeLessonIndex.value = 0
    }
    alert('Lesson deleted successfully!')
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}

const saveLesson = async () => {
  if (!activeLesson.value) return
  isSaving.value = true
  const token = useCookie('token').value

  try {
    const formData = new FormData()
    formData.append('program_id', activeLesson.value.program_id)
    formData.append('title', activeLesson.value.title)
    formData.append('type', activeLesson.value.type || 'document')
    formData.append('sequence_order', activeLesson.value.sequence_order || 1)

    if (activeLesson.value.type === 'document' && pdfFile.value) {
      formData.append('pdf', pdfFile.value)
    } else {
      formData.append('data', activeLesson.value.data || '')
    }

    const isEdit = !!activeLesson.value.id
    const url = isEdit 
      ? `${config.public.apiBase}/api/lessons/${activeLesson.value.id}`
      : `${config.public.apiBase}/api/lessons`
    const method = isEdit ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Save failed')

    alert('Lesson saved successfully!')
    pdfFile.value = null
    
    await fetchLessonsForProgram(selectedProgramId.value)
  } catch (err) {
    alert(`Error: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await dataStore.fetchData('programs')
  if (dataStore.programs.length) {
    const targetProgramId = route.query.program_id

    if (targetProgramId) {
      selectedProgramId.value = Number(targetProgramId)
    } else {
      selectedProgramId.value = dataStore.programs[0].id
    }    
    await fetchLessonsForProgram(selectedProgramId.value)
  }
})
</script>

<style scoped>
.taskbar-col, .editing-col {
  height: calc(100vh - 80px);
}
</style>