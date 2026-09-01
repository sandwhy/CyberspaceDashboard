<template>
  <div class="quiz-viewer">
    <v-card flat class="pa-2 bg-transparent">
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold">Interactive Quiz</h2>
          <span class="text-caption text-medium-emphasis">
            Total Items: {{ questions.length }}
          </span>
        </div>
      </div>

      <v-divider class="mb-3"></v-divider>

      <div v-if="questions.length > 0">
        <v-card
          v-for="(q, qIndex) in questions"
          :key="q.id || qIndex"
          variant="outlined"
          class="pa-3 mb-3 rounded-lg bg-surface"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-bold">
              {{ q.type === 'admin_notes' ? q.question : `${qIndex + 1}. ${q.question || 'Untitled Question'}` }}
            </div>
            <v-chip 
              size="x-small" 
              variant="tonal" 
              :color="q.type === 'admin_notes' ? 'orange-darken-2' : 'primary'" 
              class="text-uppercase"
            >
              {{ (q.type || 'multiple_choice').replace('_', ' ') }}
            </v-chip>
          </div>

          <!-- ADMIN NOTES (READ-ONLY) -->
          <v-textarea
            v-if="q.type === 'admin_notes'"
            v-model="userAnswers[qIndex]"
            label="Admin Notes"
            variant="outlined"
            density="compact"
            rows="3"
            hide-details
            disabled
            class="mt-2"
          />

          <!-- MULTIPLE CHOICE -->
          <v-radio-group
            v-else-if="q.type === 'multiple_choice' || !q.type"
            v-model="userAnswers[qIndex]"
            hide-details
            density="compact"
          >
            <v-radio
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              :label="opt"
              :value="optIdx"
              :disabled="disabled"
              class="mb-1"
            />
          </v-radio-group>

          <!-- SHORT ANSWER -->
          <v-text-field
            v-else-if="q.type === 'short_answer'"
            v-model="userAnswers[qIndex]"
            label="Your Answer"
            placeholder="Type your short answer here..."
            variant="outlined"
            density="compact"
            hide-details
            :disabled="disabled"
            class="mt-2"
          />

          <!-- ESSAY -->
          <v-textarea
            v-else-if="q.type === 'essay'"
            v-model="userAnswers[qIndex]"
            label="Your Essay Response"
            placeholder="Write your comprehensive answer here..."
            variant="outlined"
            density="compact"
            rows="4"
            hide-details
            :disabled="disabled"
            class="mt-2"
          />
        </v-card>
      </div>

      <v-alert v-else type="warning" variant="tonal" class="mt-2">
        No quiz questions found in this lesson.
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  quizData: {
    type: [String, Object],
    default: ''
  },
  savedAnswers: {
    type: [String, Object],
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-answers'])

const questions = ref([])
const userAnswers = ref({})

const loadQuiz = (dataPayload, savedPayload) => {
  userAnswers.value = {}
  if (!dataPayload) {
    questions.value = []
    return
  }

  try {
    const parsed = typeof dataPayload === 'string' ? JSON.parse(dataPayload) : dataPayload
    questions.value = parsed.questions || []

    questions.value.forEach((q, idx) => {
      const qKey = q.id || idx
      if (q.type === 'admin_notes') {
        // Pre-fill with the admin's notes from q.answer so it displays read-only
        userAnswers.value[idx] = q.answer || ''
      } else if (savedPayload) {
        const parsedAnswers = typeof savedPayload === 'string' ? JSON.parse(savedPayload) : savedPayload
        if (parsedAnswers[qKey]) {
          userAnswers.value[idx] = parsedAnswers[qKey].answer
        }
      }
    })
  } catch (err) {
    console.warn('Failed to parse quiz JSON or saved answers:', err)
    questions.value = []
  }
}

watch(() => [props.quizData, props.savedAnswers], ([newQuiz, newSaved]) => {
  loadQuiz(newQuiz, newSaved)
}, { immediate: true, deep: true })

watch(userAnswers, () => {
  const formattedAnswers = {}
  questions.value.forEach((q, idx) => {
    const answerValue = userAnswers.value[idx]
    formattedAnswers[q.id || idx] = {
      question_id: q.id || idx,
      type: q.type || 'multiple_choice',
      question: q.question,
      answer: answerValue,
      selected_option_text: (q.type === 'multiple_choice' || !q.type) ? (q.options?.[answerValue] ?? null) : null
    }
  })
  emit('update-answers', formattedAnswers)
}, { deep: true })
</script>