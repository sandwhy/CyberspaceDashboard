<template>
  <div class="quiz-builder">
    <div class="d-flex align-center justify-space-between mb-4">
      <span class="text-subtitle-1 font-weight-bold">Quiz Form Builder</span>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        variant="tonal"
        @click="addQuestion"
      >
        Add Question
      </v-btn>
    </div>

    <div v-if="questions.length > 0" class="d-flex flex-column gap-4">
      <v-card
        v-for="(q, qIndex) in questions"
        :key="qIndex"
        variant="outlined"
        class="pa-4 rounded-lg bg-surface relative-card mb-3"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <v-chip size="small" color="primary" label class="font-weight-bold">
            Question #{{ qIndex + 1 }}
          </v-chip>
          <v-btn
            icon="mdi-delete-outline"
            color="error"
            variant="text"
            density="compact"
            @click="removeQuestion(qIndex)"
          />
        </div>

        <v-row density="compact">
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="q.question"
              label="Question Prompt *"
              placeholder="e.g. What does API stand for?"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-select
              v-model="q.type"
              :items="[
                { title: 'Multiple Choice', value: 'multiple_choice' },
                { title: 'Short Answer', value: 'short_answer' },
                { title: 'Essay Question', value: 'essay' }
              ]"
              label="Question Type"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onTypeChange(q)"
            />
          </v-col>
        </v-row>

        <div v-if="q.type === 'multiple_choice'" class="mt-4 pt-2 border-t">
          <div class="text-caption text-grey font-weight-bold mb-2">
            Options (Click radio button to mark correct answer):
          </div>

          <v-radio-group v-model="q.correct_answer" hide-details density="compact">
            <div
              v-for="(opt, optIndex) in q.options"
              :key="optIndex"
              class="d-flex align-center mb-2"
            >
              <v-radio :value="optIndex" color="success" density="compact" class="mr-1" />
              
              <v-text-field
                v-model="q.options[optIndex]"
                placeholder="Option text..."
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1 mr-2"
              />

              <v-btn
                icon="mdi-close"
                color="grey"
                variant="text"
                density="compact"
                :disabled="q.options.length <= 2"
                @click="removeOption(q, optIndex)"
              />
            </div>
          </v-radio-group>

          <v-btn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-plus"
            class="mt-1"
            @click="addOption(q)"
          >
            Add Option
          </v-btn>
        </div>

        <div v-else-if="q.type === 'essay'" class="mt-3 text-caption text-grey border-t pt-2">
          <v-row density="compact" class="align-center">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="q.max_words"
                type="number"
                label="Max Word Limit (Optional)"
                placeholder="e.g. 500"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6" class="text-caption text-grey">
              Students will get a long-form text area to write their answer.
            </v-col>
          </v-row>
        </div>

        <div v-else-if="q.type === 'short_answer'" class="mt-3 text-caption text-grey border-t pt-2">
          Students will get a single-line text field for short responses.
        </div>
      </v-card>
    </div>

    <v-card v-else flat variant="outlined" class="pa-8 text-center rounded-lg border-dashed">
      <v-icon size="36" color="grey">mdi-help-circle-outline</v-icon>
      <div class="text-body-2 text-grey mt-2">No questions created yet. Click <strong>Add Question</strong> to start.</div>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String, // Expects JSON string or empty string
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const questions = ref([])

// 1. Initialize questions array from incoming JSON prop
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      if (questions.value.length === 0) questions.value = []
      return
    }
    try {
      const parsed = typeof newVal === 'string' ? JSON.parse(newVal) : newVal
      questions.value = parsed.questions || []
    } catch (e) {
      console.warn('Failed to parse quiz JSON, starting fresh.', e)
      questions.value = []
    }
  },
  { immediate: true }
)

// 2. Automatically sync questions array back as JSON string
watch(
  questions,
  (updatedQuestions) => {
    const payload = JSON.stringify({ questions: updatedQuestions })
    emit('update:modelValue', payload)
  },
  { deep: true }
)

// Helper Actions
const addQuestion = () => {
  questions.value.push({
    id: Date.now(),
    type: 'multiple_choice',
    question: '',
    options: ['Option 1', 'Option 2'],
    correct_answer: 0
  })
}

const removeQuestion = (index) => {
  questions.value.splice(index, 1)
}

const addOption = (questionObj) => {
  questionObj.options.push(`Option ${questionObj.options.length + 1}`)
}

const removeOption = (questionObj, optIndex) => {
  questionObj.options.splice(optIndex, 1)
  if (questionObj.correct_answer >= questionObj.options.length) {
    questionObj.correct_answer = 0
  }
}

const onTypeChange = (questionObj) => {
  if (questionObj.type === 'multiple_choice' && !questionObj.options) {
    questionObj.options = ['Option 1', 'Option 2']
    questionObj.correct_answer = 0
  }
}
</script>

<style scoped>
.border-dashed {
  border-style: dashed !important;
}
</style>