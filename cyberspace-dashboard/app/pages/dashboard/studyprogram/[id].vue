<template>
  <v-container fluid class="pa-0 h-100">
    <v-row no-gutters class="h-100">
      
      <v-col cols="12" md="4" lg="3" class="border-e bg-surface d-flex flex-column sidebar-col">
        
        <div class="pa-4 border-b">
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-arrow-left"
            class="mb-2 text-none"
            @click="router.push('/dashboard')"
          >
            Back to Dashboard
          </v-btn>
          <div class="text-h6 font-weight-bold truncate">
            {{ currentProgram?.title || 'Study Program' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Program ID: {{ programId }}
          </div>
        </div>

        <div class="pa-2 overflow-y-auto flex-grow-1">
          <div class="d-flex align-center justify-space-between px-2 mb-2">
            <span class="text-caption text-uppercase font-weight-bold text-grey">
              Lessons List
            </span>
            <v-chip size="x-small" color="primary" variant="flat">
              {{ lessons.length }}
            </v-chip>
          </div>

          <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-2" />

          <v-list v-else density="compact" nav class="pa-0">
            <v-list-item
              v-for="lesson in lessons"
              :key="lesson.id"
              :active="activeLesson?.id === lesson.id"
              color="primary"
              variant="tonal"
              class="mb-1 rounded-lg"
              @click="selectLesson(lesson)"
            >
              <template #prepend>
                <v-icon :icon="getLessonIcon(lesson.type)" size="small" class="mr-2" />
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ lesson.title }}
              </v-list-item-title>

              <template #append>
                <v-chip size="x-small" :color="lesson.is_required ? 'warning' : 'grey'" variant="outlined">
                  {{ lesson.is_required ? 'Required' : 'Optional' }}
                </v-chip>
              </template>
            </v-list-item>

            <v-sheet v-if="!lessons.length" class="pa-4 text-center text-caption text-grey">
              No lessons available for this program.
            </v-sheet>
          </v-list>
        </div>
      </v-col>

      <v-col cols="12" md="8" lg="9" class="bg-background d-flex flex-column h-100 overflow-y-auto pa-6">
        <template v-if="activeLesson">
          <div class="d-flex align-center justify-space-between mb-4 pb-3 border-b">
            <div>
              <div class="text-caption text-uppercase color-primary font-weight-bold">
                Type: {{ activeLesson.type }}
              </div>
              <h1 class="text-h5 font-weight-bold">
                {{ activeLesson.title }}
              </h1>
            </div>

            <v-btn
              color="success"
              prepend-icon="mdi-check-circle"
              variant="tonal"
              @click="markCompleted"
            >
              Mark Completed
            </v-btn>
          </div>

          <v-card variant="outlined" class="pa-4 rounded-lg flex-grow-1 bg-surface">
            
            <div v-if="activeLesson.type === 'document'" class="h-100 d-flex flex-column">
              <iframe
                v-if="activeLesson.pdf_url || activeLesson.pdfUrl"
                :src="activeLesson.pdf_url || activeLesson.pdfUrl"
                width="100%"
                height="650px"
                class="rounded border-0"
              ></iframe>
              <v-alert v-else type="info" variant="tonal">
                No PDF URL available for this lesson.
              </v-alert>
            </div>

            <div
              v-else-if="activeLesson.type === 'text'"
              class="lesson-text-content pa-2"
              v-html="activeLesson.data"
            ></div>

            <div v-else-if="activeLesson.type === 'quiz'">
              <QuizViewer :quiz-data="activeLesson.data" />
            </div>

          </v-card>
        </template>

        <v-sheet v-else class="d-flex flex-column align-center justify-center fill-height rounded-lg border pa-6">
          <v-icon icon="mdi-book-open-page-variant" size="64" color="grey" class="mb-2" />
          <div class="text-h6 text-grey">Select a lesson from the left sidebar to start studying</div>
        </v-sheet>
      </v-col>

    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'dashboards'
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const dataStore = useDataStore()

const programId = computed(() => route.params.id)
const lessons = ref([])
const activeLesson = ref(null)
const isLoading = ref(false)

// Extract current program details from Pinia store
const currentProgram = computed(() => {
  return dataStore.programs?.find(p => String(p.id) === String(programId.value))
})

// Returns specific icons based on lesson type
const getLessonIcon = (type) => {
  switch (type) {
    case 'document': return 'mdi-file-pdf-box'
    case 'text': return 'mdi-text-box-outline'
    case 'quiz': return 'mdi-help-circle-outline'
    default: return 'mdi-book-outline'
  }
}

const selectLesson = (lesson) => {
  activeLesson.value = lesson
}

const fetchProgramLessons = async () => {
  isLoading.value = true
  try {
    const token = useCookie('token').value
    const response = await fetch(`${config.public.apiBase}/api/lessons?programId=${programId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Failed to fetch lessons')
    
    const result = await response.json()
    lessons.value = Array.isArray(result) ? result : (result.data || [])

    // Automatically select the first lesson by default
    if (lessons.value.length > 0) {
      activeLesson.value = lessons.value[0]
    }
  } catch (err) {
    console.error('Error fetching lessons:', err)
  } finally {
    isLoading.value = false
  }
}

const markCompleted = () => {
  alert(`Marked "${activeLesson.value?.title}" as completed!`)
}

onMounted(async () => {
  // Ensure store programs are available
  if (!dataStore.programs?.length) {
    await dataStore.fetchData('programs')
  }
  await fetchProgramLessons()
})

watch(() => route.params.id, () => {
  fetchProgramLessons()
})
</script>

<style scoped>
.sidebar-col {
  height: calc(100vh - 64px);
}
.lesson-text-content {
  line-height: 1.6;
  font-size: 1.05rem;
}
</style>