<template>
  <div class="quiz-viewer">
    <v-card flat class="pa-2 bg-transparent">
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold">Interactive Quiz</h2>
          <span class="text-caption text-medium-emphasis">
            Total Questions: {{ shuffledQuestions.length }}
          </span>
        </div>
        
        <v-chip
          v-if="submitted"
          :color="allCorrect ? 'success' : 'error'"
          class="font-weight-bold"
          size="small"
        >
          <v-icon start :icon="allCorrect ? 'mdi-check-circle' : 'mdi-close-circle'" />
          Score: {{ scorePercentage }}% {{ allCorrect ? '(All Correct!)' : '(Requires 100% to Complete)' }}
        </v-chip>
      </div>

      <v-divider class="mb-3"></v-divider>

      <div v-if="shuffledQuestions.length > 0">
        <v-card
          v-for="(q, qIndex) in shuffledQuestions"
          :key="q.id || qIndex"
          variant="outlined"
          class="pa-3 mb-3 rounded-lg bg-surface"
        >
          <div class="text-body-2 font-weight-bold mb-2">
            {{ qIndex + 1 }}. {{ q.question || 'Untitled Question' }}
          </div>

          <v-radio-group
            v-model="userAnswers[qIndex]"
            :disabled="submitted"
            hide-details
            density="compact"
          >
            <v-radio
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              :label="opt"
              :value="optIdx"
              class="mb-1"
            />
          </v-radio-group>

          <div v-if="submitted" class="mt-1 text-caption font-weight-bold">
            <span v-if="userAnswers[qIndex] === q.correct_answer" class="text-success">
              ✓ Correct
            </span>
            <span v-else class="text-error">
              ✗ Incorrect. Correct answer: {{ q.options[q.correct_answer] }}
            </span>
          </div>
        </v-card>

        <div class="d-flex ga-2 mt-3">
          <v-btn
            v-if="!submitted"
            color="primary"
            size="small"
            block
            @click="submitQuiz"
          >
            Submit Quiz
          </v-btn>

          <v-btn
            v-else
            color="secondary"
            variant="outlined"
            size="small"
            block
            @click="resetAndReshuffle"
          >
            Retake Quiz (Reshuffle Order)
          </v-btn>
        </div>
      </div>

      <v-alert v-else type="warning" variant="tonal" class="mt-2">
        No quiz questions found in this lesson.
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps({
  quizData: {
    type: [String, Object],
    default: ''
  }
})

const emit = defineEmits(['quiz-passed'])

const rawQuestions = ref([])
const shuffledQuestions = ref([])
const userAnswers = ref({})
const submitted = ref(false)

// Fisher-Yates shuffle algorithm to randomize question order
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const loadAndShuffleQuiz = (dataPayload) => {
  submitted.value = false
  userAnswers.value = {}
  emit('quiz-passed', false) // Reset completion lock

  if (!dataPayload) {
    rawQuestions.value = []
    shuffledQuestions.value = []
    return
  }

  try {
    const parsed = typeof dataPayload === 'string' ? JSON.parse(dataPayload) : dataPayload
    rawQuestions.value = parsed.questions || []
    // Randomize questions order on load
    shuffledQuestions.value = shuffleArray(rawQuestions.value)
  } catch (err) {
    console.warn('Failed to parse quiz JSON:', err)
    rawQuestions.value = []
    shuffledQuestions.value = []
  }
}

watch(() => props.quizData, (newVal) => {
  loadAndShuffleQuiz(newVal)
}, { immediate: true })

const allCorrect = computed(() => {
  if (!shuffledQuestions.value.length) return false
  return shuffledQuestions.value.every((q, idx) => userAnswers.value[idx] === q.correct_answer)
})

const scorePercentage = computed(() => {
  if (!shuffledQuestions.value.length) return 0
  let correctCount = 0
  shuffledQuestions.value.forEach((q, idx) => {
    if (userAnswers.value[idx] === q.correct_answer) {
      correctCount++
    }
  })
  return Math.round((correctCount / shuffledQuestions.value.length) * 100)
})

const submitQuiz = () => {
  submitted.value = true
  // Emit true ONLY if all questions are answered correctly (100% score)
  emit('quiz-passed', allCorrect.value)
}

const resetAndReshuffle = () => {
  loadAndShuffleQuiz(props.quizData)
}
</script>