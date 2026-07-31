<template>
  <div class="pdf-viewer d-flex flex-column h-100">
    <v-card variant="outlined" class="pa-2 px-3 mb-3 rounded-lg bg-surface flex-shrink-0">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-file-pdf-box" color="red-darken-1" size="medium" />
          <div>
            <div class="text-body-2 font-weight-bold">
              {{ title || 'PDF Document' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ pdfUrl ? 'Document Ready' : 'No document URL provided' }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center ga-2" v-if="pdfUrl">
          <v-btn
            :color="showPreview ? 'primary' : 'secondary'"
            :variant="showPreview ? 'flat' : 'outlined'"
            size="x-small"
            :prepend-icon="showPreview ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? 'Hide Onsite Preview' : 'Display Onsite' }}
          </v-btn>

          <v-btn
            color="success"
            variant="tonal"
            size="x-small"
            prepend-icon="mdi-download-outline"
            :href="resolvedPdfUrl"
            target="_blank"
            download
          >
            Download PDF
          </v-btn>
        </div>
      </div>
    </v-card>

    <div
      v-if="showPreview && pdfUrl"
      class="pdf-frame-container rounded-lg border overflow-hidden flex-grow-1 min-h-0"
    >
      <iframe
        :src="resolvedPdfUrl"
        width="100%"
        height="100%"
        style="border: none; display: block;"
        allowfullscreen
      ></iframe>
    </div>

    <v-sheet
      v-if="!showPreview && pdfUrl"
      class="pa-8 text-center rounded-lg border border-dashed text-medium-emphasis flex-grow-1 d-flex flex-column align-center justify-center"
    >
      <v-icon icon="mdi-file-eye-outline" size="48" class="mb-2" />
      <div>Click <strong>"Display Onsite"</strong> above to preview this document directly on the page.</div>
    </v-sheet>

    <v-alert v-if="!pdfUrl" type="warning" variant="tonal" class="mt-2 flex-shrink-0">
      No PDF path or URL attached to this lesson.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  pdfUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  defaultShowPreview: {
    type: Boolean,
    default: true
  }
})

const config = useRuntimeConfig()
const showPreview = ref(props.defaultShowPreview)

// Prepends backend host URL if relative path is passed
const resolvedPdfUrl = computed(() => {
  if (!props.pdfUrl) return ''
  if (props.pdfUrl.startsWith('http://') || props.pdfUrl.startsWith('https://')) {
    return props.pdfUrl
  }
  const apiBase = config.public.apiBase || 'http://localhost:5000'
  return `${apiBase.replace(/\/$/, '')}${props.pdfUrl.startsWith('/') ? '' : '/'}${props.pdfUrl}`
})
</script>

<style scoped>
.pdf-viewer {
  min-height: 0;
}

.pdf-frame-container {
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.min-h-0 {
  min-height: 0;
}
</style>