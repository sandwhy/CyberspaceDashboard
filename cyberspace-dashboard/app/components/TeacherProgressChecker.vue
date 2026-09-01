<template>
  <v-container fluid class="pa-4">
    <v-card class="rounded-lg pa-4">
<!-- Certificate History Section -->
    <v-card v-if="selectedTeacherId && selectedProgramId" class="rounded-lg pa-4 mt-4" variant="outlined">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="text-subtitle-1 font-weight-bold">
          Issued Certificates History ({{ teacherCertificates.length }})
        </div>
      </div>

      <v-divider class="mb-3"></v-divider>

    <v-list v-if="teacherCertificates.length > 0" density="compact">
        <v-list-item
          v-for="cert in teacherCertificates"
          :key="cert.id"
          class="border rounded-lg mb-2 bg-surface"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-certificate" color="success" class="mr-3" />
          </template>

          <v-list-item-title class="font-weight-bold text-body-2">
            Code: {{ cert.certificate_code }}
          </v-list-item-title>
          
          <v-list-item-subtitle class="text-caption">
            Issued At: {{ new Date(cert.issued_at).toLocaleString() }} | 
            <strong>Issued By:</strong> {{ cert.issued_by_username || 'System' }}
            <span v-if="cert.image_link">| <a :href="cert.image_link" target="_blank">View Asset</a></span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <div v-else class="text-caption text-grey text-center py-2">
        No certificates have been generated for this user and program combination yet.
      </div>
    </v-card>

      <v-divider class="mb-4"></v-divider>

      
<v-row class="mb-4 align-center">
    <v-col cols="12" sm="6" md="4">
      <v-select
        v-model="selectedTeacherId"
        :items="teachersList"
        item-title="username"
        item-value="id"
        label="Select User"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        @update:model-value="onTeacherSelect"
      />
    </v-col>
    
    <v-col cols="12" sm="6" md="4">
      <v-select
        v-model="selectedProgramId"
        :items="teacherPrograms"
        item-title="program_title"
        item-value="program_id"
        label="Select Assigned Program"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        :disabled="!selectedTeacherId"
        @update:model-value="fetchLessonProgress"
      />
    </v-col>

    <v-col cols="12" sm="6" md="4" class="d-flex justify-end" v-if="selectedTeacherId && selectedProgramId">
      <v-btn
        color="success"
        prepend-icon="mdi-certificate-outline"
        variant="flat"
        size="small"
        class="font-weight-bold px-4 text-none"
        @click="generateCertificate"
      >
        Generate Certificate
      </v-btn>
    </v-col>
  </v-row>

      <!-- Lessons Status Table -->
      <v-data-table
        v-if="selectedTeacherId && selectedProgramId"
        :headers="headers"
        :items="lessonsProgress"
        hover
        class="bg-transparent"
      >
        <template v-slot:item.type="{ item }">
          <v-chip size="x-small" color="primary" variant="tonal" class="text-uppercase font-weight-bold">
            {{ item.type }}
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip size="x-small" :color="getStatusColor(item.status)" variant="flat" class="text-uppercase font-weight-bold">
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <!-- Review Quiz Answers if available -->
            <v-btn
              v-if="item.type === 'quiz' && item.quiz_answers"
              size="small"
              color="info"
              variant="tonal"
              prepend-icon="mdi-eye-outline"
              @click="openQuizReview(item)"
            >
              Review Quiz
            </v-btn>

            <!-- Reset status to 'in_progress' so teacher can redo -->
            <v-btn
              size="small"
              color="warning"
              variant="outlined"
              @click="updateStatus(item.lesson_id, 'in_progress')"
            >
              Set Active (Redo)
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <v-sheet v-else class="text-center pa-8 text-grey border-dashed rounded-lg">
        <v-icon icon="mdi-account-school-outline" size="48" class="mb-2" />
        <div>Please select a <strong>Teacher</strong> and an <strong>Assigned Program</strong> to view lesson statuses.</div>
      </v-sheet>
    </v-card>

    <!-- Quiz Answers Modal Checker -->
    <v-dialog v-model="quizModalOpen" max-width="600px">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">Quiz Submission Review</v-card-title>
        <v-card-text>
          <div v-if="activeQuizAnswers" class="d-flex flex-column ga-3">
            <div v-for="(ans, key) in activeQuizAnswers" :key="key" class="pa-3 border rounded-lg bg-surface">
              <div class="font-weight-bold text-subtitle-2 mb-1">{{ ans.question }}</div>
              <div class="text-body-2 text-medium-emphasis">
                <strong>Response:</strong> {{ ans.selected_option_text || ans.answer || 'No answer provided' }}
              </div>
            </div>
          </div>
          <div v-else class="text-grey text-center py-4">No answers recorded for this submission.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" variant="flat" @click="approveQuiz(activeReviewLessonId)">
            Approve & Complete
          </v-btn>
          <v-btn color="warning" variant="tonal" @click="updateStatus(activeReviewLessonId, 'in_progress'); quizModalOpen = false;">
            Reject / Allow Redo
          </v-btn>
          <v-btn color="grey" variant="text" @click="quizModalOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const dataStore = useDataStore() // Utilizing Pinia data store[cite: 22, 23]
const config = useRuntimeConfig()

const selectedTeacherId = ref(null)
const selectedProgramId = ref(null)
const teacherPrograms = ref([])
const lessonsProgress = ref([])
const teacherCertificates = ref([])

const quizModalOpen = ref(false)
const activeQuizAnswers = ref(null)
const activeReviewLessonId = ref(null)

const headers = [
  { title: 'Seq', key: 'sequence_order', align: 'start' },
  { title: 'Lesson Title', key: 'title', align: 'start' },
  { title: 'Type', key: 'type', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

// Extract teachers directly from Pinia store cache
const teachersList = computed(() => {
  const users = Array.isArray(dataStore.users) ? dataStore.users : (dataStore.users?.data || [])
  return users.filter(u => u.role_name && u.role_name !== 'unregistered')
})

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success'
    case 'pending_review': return 'info'
    case 'in_progress': return 'warning'
    default: return 'grey'
  }
}

// When teacher changes, fetch their specific assigned programs
const onTeacherSelect = async () => {
selectedProgramId.value = null
  teacherPrograms.value = []
  lessonsProgress.value = []
  teacherCertificates.value = []
  if (!selectedTeacherId.value) return

  const token = useCookie('token').value
  try {
    const res = await fetch(`${config.public.apiBase}/api/lessonsAssignment/teacher/${selectedTeacherId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    teacherPrograms.value = data.data || []
  } catch (err) {
    console.error('Failed to fetch teacher programs:', err)
  }
}

// Fetch lesson progress and certificate history together
const fetchLessonProgress = async () => {
  if (!selectedTeacherId.value || !selectedProgramId.value) return

  const token = useCookie('token').value
  try {
    // 1. Fetch lessons progress
    const progressRes = await fetch(`${config.public.apiBase}/api/lessonProgress/operator/progress?teacher_id=${selectedTeacherId.value}&program_id=${selectedProgramId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const progressData = await progressRes.json()
    lessonsProgress.value = progressData.lessons_progress || []

    // 2. Fetch certificate history for this user & program
    const certRes = await fetch(`${config.public.apiBase}/api/certificates?teacher_id=${selectedTeacherId.value}&program_id=${selectedProgramId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const certData = await certRes.json()
    teacherCertificates.value = certData.data || []
    console.log('--- teacherprogesschecker fetchlessonsprogress')
    console.log(progressData)
  } catch (err) {
    console.error('Failed to fetch progress or certificates:', err)
  }
}

const openQuizReview = (item) => {
  activeReviewLessonId.value = item.lesson_id
  activeQuizAnswers.value = typeof item.quiz_answers === 'string' ? JSON.parse(item.quiz_answers) : item.quiz_answers
  quizModalOpen.value = true
}

const updateStatus = async (lessonId, status) => {
  const token = useCookie('token').value
  try {
    const res = await fetch(`${config.public.apiBase}/api/lessonProgress/operator/lessons/${lessonId}/reset`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        teacher_id: selectedTeacherId.value, 
        status 
      })
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      quizModalOpen.value = false
      await fetchLessonProgress()
    } else {
      console.error('Failed to update status:', data.message)
      alert(data.message || 'Failed to update lesson status.')
    }
  } catch (err) {
    console.error('Network or server error updating status:', err)
  }
}
const generateCertificate = async () => {
  if (!selectedTeacherId.value || !selectedProgramId.value) return

  const token = useCookie('token').value
  const certificate_code = `CERT-${selectedTeacherId.value}-${selectedProgramId.value}-${Date.now().toString().slice(-6)}`

  try {
    const res = await fetch(`${config.public.apiBase}/api/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        teacher_id: selectedTeacherId.value,
        program_id: selectedProgramId.value,
        certificate_code,
        image_link: null // Optional: can be bound to an input field if operators upload badge/image links
      })
    })
    const data = await res.json()
    if (res.ok) {
      alert(`Certificate successfully generated! Code: ${certificate_code}`)
    } else {
      alert(data.message || 'Failed to generate certificate.')
    }
  } catch (err) {
    console.error('Error issuing certificate:', err)
  }
}

const approveQuiz = async (lessonId) => {
  await updateStatus(lessonId, 'completed')
}

onMounted(async () => {
  // Pre-load users cache via Pinia store if empty[cite: 23]
  if (!dataStore.users?.length) {
    await dataStore.fetchData('users')
  }
})
</script>