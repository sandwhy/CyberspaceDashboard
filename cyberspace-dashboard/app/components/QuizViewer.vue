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
      </div>

      <v-divider class="mb-3"></v-divider>

      <div v-if="shuffledQuestions.length > 0">
        <v-card
          v-for="(q, qIndex) in shuffledQuestions"
          :key="q.id || qIndex"
          variant="outlined"
          class="pa-3 mb-3 rounded-lg bg-surface"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-bold">
              {{ qIndex + 1 }}. {{ q.question || 'Untitled Question' }}
            </div>
            <v-chip size="x-small" variant="tonal" color="primary" class="text-uppercase">
              {{ (q.type || 'multiple_choice').replace('_', ' ') }}
            </v-chip>
          </div>

          <!-- MULTIPLE CHOICE -->
          <v-radio-group
            v-if="q.type === 'multiple_choice' || !q.type"
            v-model="userAnswers[qIndex]"
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

          <!-- SHORT ANSWER -->
          <v-text-field
            v-else-if="q.type === 'short_answer'"
            v-model="userAnswers[qIndex]"
            label="Your Answer"
            placeholder="Type your short answer here..."
            variant="outlined"
            density="compact"
            hide-details
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
  }
})

const emit = defineEmits(['update-answers'])

const rawQuestions = ref([])
const shuffledQuestions = ref([])
const userAnswers = ref({})

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const loadAndShuffleQuiz = (dataPayload) => {
  userAnswers.value = {}
  if (!dataPayload) {
    rawQuestions.value = []
    shuffledQuestions.value = []
    return
  }

  try {
    const parsed = typeof dataPayload === 'string' ? JSON.parse(dataPayload) : dataPayload
    rawQuestions.value = parsed.questions || []
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

// Automatically bundle and emit answers whenever user types or selects anything
watch(userAnswers, () => {
  const formattedAnswers = {}
  shuffledQuestions.value.forEach((q, idx) => {
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