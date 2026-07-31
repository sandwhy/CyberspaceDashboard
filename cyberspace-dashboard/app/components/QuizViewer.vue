<template>
  <div class="quiz-viewer">
    <v-card flat class="pa-2">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h2 class="text-h6 font-weight-bold">Interactive Quiz</h2>
          <span class="text-caption text-medium-emphasis">
            Total Questions: {{ questions.length }}
          </span>
        </div>
        
        <v-chip v-if="submitted" :color="scorePercentage >= 70 ? 'success' : 'error'" class="font-weight-bold">
          Score: {{ scorePercentage }}%
        </v-chip>
      </div>

      <v-divider class="mb-4"></v-divider>

      <div v-if="questions.length > 0">
        <v-card
          v-for="(q, qIndex) in questions"
          :key="q.id || qIndex"
          variant="outlined"
          class="pa-4 mb-4 rounded-lg bg-surface"
        >
          <div class="text-subtitle-1 font-weight-bold mb-3">
            {{ qIndex + 1 }}. {{ q.question || 'Untitled Question' }}
          </div>

          <v-radio-group
            v-model="userAnswers[qIndex]"
            :disabled="submitted"
            hide-details
          >
            <v-radio
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              :label="opt"
              :value="optIdx"
              class="mb-1"
            />
          </v-radio-group>

          <div v-if="submitted" class="mt-2 text-caption font-weight-bold">
            <span v-if="userAnswers[qIndex] === q.correct_answer" class="text-success">
              ✓ Correct!
            </span>
            <span v-else class="text-error">
              ✗ Incorrect. Correct answer: {{ q.options[q.correct_answer] }}
            </span>
          </div>
        </v-card>

        <div class="d-flex ga-2 mt-4">
          <v-btn
            v-if="!submitted"
            color="primary"
            size="large"
            block
            @click="submitQuiz"
          >
            Submit Quiz Answers
          </v-btn>

          <v-btn
            v-else
            color="secondary"
            variant="outlined"
            size="large"
            block
            @click="resetQuiz"
          >
            Retake Quiz
          </v-btn>
        </div>
      </div>

      <v-alert v-else type="warning" variant="tonal">
        No quiz questions found in this lesson.
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  quizData: {
    type: [String, Object],
    default: ''
  }
})

const questions = ref([])
const userAnswers = ref({})
const submitted = ref(false)

// Parse incoming quiz payload
watch(
  () => props.quizData,
  (rawPayload) => {
    submitted.value = false
    userAnswers.value = {}
    if (!rawPayload) {
      questions.value = []
      return
    }
    try {
      const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
      questions.value = parsed.questions || []
    } catch (err) {
      console.warn('Failed to parse quiz JSON:', err)
      questions.value = []
    }
  },
  { immediate: true }
)

const scorePercentage = computed(() => {
  if (!questions.value.length) return 0
  let correct = 0
  questions.value.forEach((q, idx) => {
    if (userAnswers.value[idx] === q.correct_answer) {
      correct++
    }
  })
  return Math.round((correct / questions.value.length) * 100)
})

const submitQuiz = () => {
  submitted.value = true
}

const resetQuiz = () => {
  userAnswers.value = {}
  submitted.value = false
}
</script>