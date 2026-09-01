<template>
  <div class="program-viewer-wrapper">
    <v-row no-gutters class="fill-height">
      
      <!-- Sidebar Lesson List -->
      <v-col cols="12" md="4" lg="3" class="sidebar-col border-e bg-surface d-flex flex-column">
        <div class="pa-3 border-b flex-shrink-0">
          <div class="text-subtitle-1 font-weight-bold text-truncate">
            {{ currentProgram?.title || 'Study Program' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Program ID: {{ programId }}
          </div>
        </div>

        <div class="pa-2 overflow-y-auto flex-grow-1">
          <div class="d-flex align-center justify-space-between px-2 mb-2">
            <span class="text-overline font-weight-bold text-grey">Lessons</span>
            <v-chip size="x-small" color="primary" variant="flat">{{ lessons.length }}</v-chip>
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
              
              <v-list-item-title class="text-body-2 font-weight-medium text-truncate">
                {{ lesson.title }}
              </v-list-item-title>

              <template #append>
                <div class="d-flex align-center ga-1">
                  <!-- Progress status indicator chip -->
                  <v-chip 
                    size="x-small" 
                    :color="getProgressColor(lessonProgress[lesson.id]?.status)" 
                    variant="flat"
                  >
                    {{ formatStatusLabel(lessonProgress[lesson.id]?.status) }}
                  </v-chip>
                  <v-chip size="x-small" :color="lesson.is_required ? 'warning' : 'grey'" variant="outlined">
                    {{ lesson.is_required ? 'Req' : 'Opt' }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-col>

      <!-- Content Viewer Area -->
      <v-col cols="12" md="8" lg="9" class="content-col bg-background d-flex flex-column">
        <template v-if="activeLesson">
          <div class="pa-3 px-4 border-b bg-surface d-flex align-center justify-space-between flex-shrink-0">
            <div class="d-flex align-center ga-2 text-truncate">
              <v-chip size="small" color="primary" variant="tonal" class="text-uppercase font-weight-bold">
                {{ activeLesson.type }}
              </v-chip>
              <h2 class="text-subtitle-1 font-weight-bold text-truncate mb-0">
                {{ activeLesson.title }}
              </h2>
            </div>
            
            <v-chip size="small" :color="getProgressColor(activeLessonStatus)" class="font-weight-bold text-uppercase">
              Status: {{ activeLessonStatus.replace('_', ' ') }}
            </v-chip>
          </div>

          <!-- Check if lesson is started -->
          <template v-if="activeLessonStatus === 'not_started'">
            <v-sheet class="d-flex flex-column align-center justify-center fill-height bg-background pa-6 text-center">
              <v-icon icon="mdi-lock-outline" size="48" color="warning" class="mb-2" />
              <div class="text-h6 font-weight-bold mb-1">Lesson Not Started</div>
              <div class="text-body-2 text-grey mb-4">You must start this lesson before you can view its content and track progress.</div>
              <v-btn color="primary" variant="flat" @click="startLesson">
                Start Lesson First
              </v-btn>
            </v-sheet>
          </template>

          <!-- Content Viewer -->
          <template v-else>
            <div class="viewer-body-scroll pa-4 flex-grow-1 overflow-y-auto">
              <PdfViewer
                v-if="activeLesson.type === 'document'"
                :pdf-url="activeLesson.data"
                :title="activeLesson.title"
              />

              <VideoViewer
                v-else-if="activeLesson.type === 'video'"
                :video-url="activeLesson.data"
                :title="activeLesson.title"
              />

              <v-card v-else-if="activeLesson.type === 'text'" variant="outlined" class="pa-4 bg-surface rounded-lg">
                <div class="text-body-2" v-html="activeLesson.data"></div>
              </v-card>
              
              <QuizViewer
                v-else-if="activeLesson.type === 'quiz'"
                :quiz-data="activeLesson.data"
                :saved-answers="currentLessonSavedAnswers"
                :disabled="activeLessonStatus !== 'in_progress'"
                @update-answers="(answers) => quizAnswersPayload = answers"
              />
            </div>

            <div class="pa-3 px-4 border-t bg-surface d-flex align-center justify-space-between flex-shrink-0">
              <div class="text-caption text-medium-emphasis">
                <span v-if="activeLessonStatus === 'completed'" class="text-success font-weight-bold">
                  ✓ This lesson has already been completed.
                </span>
                <span v-else-if="activeLessonStatus === 'pending_review'" class="text-info font-weight-bold">
                  ⏳ This quiz is currently pending instructor review.
                </span>
                <span v-else-if="activeLesson.type === 'quiz'" class="text-primary font-weight-bold">
                  📝 Submit answers for manual instructor review.
                </span>
                <span v-else class="text-success font-weight-bold">
                  ✓ Ready to mark complete.
                </span>
              </div>

              <!-- Disabled when status is anything other than 'in_progress' -->
              <v-btn
                color="success"
                prepend-icon="mdi-check-circle-outline"
                variant="flat"
                size="small"
                class="font-weight-bold"
                :disabled="activeLessonStatus !== 'in_progress'"
                @click="markCompleted"
              >
                {{ activeLesson.type === 'quiz' ? 'Submit Quiz for Review' : 'Mark as Complete' }}
              </v-btn>
            </div>
          </template>
        </template>

        <v-sheet v-else class="d-flex flex-column align-center justify-center fill-height bg-background pa-6">
          <v-icon icon="mdi-book-open-page-variant" size="48" color="grey" class="mb-2" />
          <div class="text-body-2 text-grey">Select a lesson from the left sidebar to start studying</div>
        </v-sheet>
      </v-col>

    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'dashboards' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const dataStore = useDataStore()

const programId = computed(() => route.params.id)
const lessons = ref([])
const lessonProgress = ref({}) // Dictionary mapping lesson_id -> { status, quiz_answers, completed_at }
const activeLesson = ref(null)
const isLoading = ref(false)
const quizAnswersPayload = ref({})

const currentProgram = computed(() => {
  return dataStore.programs?.find(p => String(p.id) === String(programId.value))
})

const activeLessonStatus = computed(() => {
  if (!activeLesson.value) return 'not_started'
  return lessonProgress.value[activeLesson.value.id]?.status || 'not_started'
})

const currentLessonSavedAnswers = computed(() => {
  if (!activeLesson.value) return null
  return lessonProgress.value[activeLesson.value.id]?.quiz_answers || null
})

const selectLesson = (lesson) => {
  activeLesson.value = lesson
  quizAnswersPayload.value = lessonProgress.value[lesson.id]?.quiz_answers || {}
}

const getLessonIcon = (type) => {
  switch (type) {
    case 'document': return 'mdi-file-pdf-box'
    case 'video': return 'mdi-youtube'
    case 'text': return 'mdi-text-box-outline'
    case 'quiz': return 'mdi-help-circle-outline'
    default: return 'mdi-book-outline'
  }
}

const getProgressColor = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'pending_review': return 'info'
    case 'in_progress': return 'warning'
    case 'not_started': default: return 'grey'
  }
}

const formatStatusLabel = (status) => {
  switch (status) {
    case 'completed': return 'Done'
    case 'pending_review': return 'Review'
    case 'in_progress': return 'Active'
    case 'not_started': default: return 'New'
  }
}

// Fetch user-specific progress maps from backend route
const fetchLessonProgress = async () => {
  try {
    const token = useCookie('token').value
    const res = await fetch(`${config.public.apiBase}/api/lessonProgress/program/${programId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const records = Array.isArray(data) ? data : (data.lessons_progress || [])
    
    const progressMap = {}
    records.forEach(p => {
      progressMap[p.lesson_id] = {
        status: p.status || 'not_started',
        quiz_answers: p.quiz_answers || null,
        completed_at: p.completed_at || null
      }
    })
    lessonProgress.value = progressMap
    
    // Refresh active lesson progress container if already selected
    if (activeLesson.value && progressMap[activeLesson.value.id]) {
      quizAnswersPayload.value = progressMap[activeLesson.value.id].quiz_answers || {}
    }
  } catch (err) {
    console.error('Error fetching lesson progress:', err)
  }
}

const startLesson = async () => {
  if (!activeLesson.value) return
  try {
    const token = useCookie('token').value
    const res = await fetch(`${config.public.apiBase}/api/lessonProgress/lessons/${activeLesson.value.id}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status: 'in_progress' })
    })
    if (res.ok) {
      if (!lessonProgress.value[activeLesson.value.id]) {
        lessonProgress.value[activeLesson.value.id] = {}
      }
      lessonProgress.value[activeLesson.value.id].status = 'in_progress'
    }
  } catch (err) {
    console.error('Error starting lesson:', err)
  }
}

const fetchProgramLessons = async () => {
  isLoading.value = true
  try {
    const token = useCookie('token').value
    const res = await fetch(`${config.public.apiBase}/api/lessons?program_id=${programId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    lessons.value = Array.isArray(data) ? data : (data.data || [])
    if (lessons.value.length > 0) selectLesson(lessons.value[0])
  } catch (err) {
    console.error('Error fetching lessons:', err)
  } finally {
    isLoading.value = false
  }
}

const markCompleted = async () => {
  if (!activeLesson.value) return
  try {
    const token = useCookie('token').value
    
    const isQuiz = activeLesson.value.type === 'quiz'
    const newStatus = isQuiz ? 'pending_review' : 'completed'

    const payload = {
      status: newStatus,
      quiz_answers: isQuiz ? quizAnswersPayload.value : null
    } 

    console.log("--- studyprogram [id]")
    console.log(payload.quiz_answers)

    const res = await fetch(`${config.public.apiBase}/api/lessonProgress/lessons/${activeLesson.value.id}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      if (!lessonProgress.value[activeLesson.value.id]) {
        lessonProgress.value[activeLesson.value.id] = {}
      }
      lessonProgress.value[activeLesson.value.id].status = newStatus
      lessonProgress.value[activeLesson.value.id].quiz_answers = payload.quiz_answers
      
      if (newStatus === 'pending_review') {
        alert(`Quiz submitted successfully for manual review!`)
      } else {
        alert(`Marked "${activeLesson.value.title}" as completed!`)
      }
    }
  } catch (err) {
    console.error('Error updating lesson progress:', err)
  }
}

onMounted(async () => {
  if (!dataStore.programs?.length) await dataStore.fetchData('programs')
  await fetchProgramLessons()
  await fetchLessonProgress()
})
</script>

<style scoped>
.program-viewer-wrapper {
  height: calc(100vh - 70px);
  overflow: hidden;
}

.sidebar-col,
.content-col {
  height: 100%;
}

.viewer-body-scroll {
  height: 100%;
}
</style>