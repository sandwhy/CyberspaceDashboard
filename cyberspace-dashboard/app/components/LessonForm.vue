<template>
  <v-dialog v-model="dialogModel" max-width="500px">
    <v-card class="rounded-lg pa-2">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold">
          {{ isEdit ? 'Edit Lesson' : 'Create Lesson' }}
        </span>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="close" />
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef">
          <v-select
            v-model="formData.program_id"
            :items="programs"
            item-title="title"
            item-value="id"
            label="Program"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-model="formData.title"
            label="Lesson Title"
            variant="outlined"
            density="compact"
          />

          <v-select
            v-model="formData.type"
            :items="['document', 'video', 'quiz']"
            label="Format Type"
            variant="outlined"
            density="compact"
          />

          <v-file-input
            v-if="formData.type === 'document'"
            v-model="pdfFile"
            accept="application/pdf"
            label="PDF Document"
            prepend-icon="mdi-file-pdf-box"
            variant="outlined"
            density="compact"
          />

          <v-text-field
            v-if="formData.type === 'video'"
            v-model="formData.file_url"
            label="Video URL"
            placeholder="https://..."
            variant="outlined"
            density="compact"
          />

          <v-row density="compact">
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.sequence_order"
                type="number"
                label="Sequence #"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" class="d-flex align-center">
              <v-checkbox
                v-model="formData.is_required"
                label="Required"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" color="grey" @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="submit">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  isEdit: Boolean,
  lessonData: {
    type: Object,
    default: () => ({})
  },
  programs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pdfFile = ref(null)
const formData = ref({
  title: '',
  program_id: null,
  type: 'document',
  file_url: '',
  sequence_order: 1,
  is_required: true
})

// Sync form data when editing or creating
watch(
  () => props.lessonData,
  (newVal) => {
    formData.value = {
      title: '',
      program_id: null,
      type: 'document',
      file_url: '',
      sequence_order: 1,
      is_required: true,
      ...newVal
    }
    pdfFile.value = null
  },
  { immediate: true }
)

const close = () => {
  dialogModel.value = false
}

const submit = () => {
  // Placeholder save logic
  console.log('Submitting Lesson Data:', formData.value, 'PDF File:', pdfFile.value)
  emit('saved', { ...formData.value, pdfFile: pdfFile.value })
  close()
}
</script>