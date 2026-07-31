<template>
  <div class="video-viewer">
    <v-card variant="outlined" class="pa-3 mb-4 rounded-lg bg-surface">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-youtube" color="red" size="large" />
          <div>
            <div class="text-subtitle-2 font-weight-bold">
              {{ title || 'Video Lesson' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ videoId ? `YouTube ID: ${videoId}` : 'No valid video URL provided' }}
            </div>
          </div>
        </div>

        <div v-if="videoUrl" class="d-flex align-center ga-2">
          <v-btn
            color="secondary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-open-in-new"
            :href="videoUrl"
            target="_blank"
          >
            Open on YouTube
          </v-btn>
        </div>
      </div>
    </v-card>

    <div v-if="embedUrl" class="rounded-lg overflow-hidden border elevation-1">
      <v-responsive :aspect-ratio="16 / 9">
        <iframe
          :src="embedUrl"
          width="100%"
          height="100%"
          style="border: 0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </v-responsive>
    </div>

    <v-alert v-else type="warning" variant="tonal" class="mt-2">
      Invalid or missing YouTube link. Please provide a valid YouTube watch or share URL.
    </v-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  videoUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})

// Helper logic to extract YouTube Video ID from various link formats
const videoId = computed(() => {
  if (!props.videoUrl) return null

  const url = props.videoUrl.trim()

  // Match standard URLs (youtube.com/watch?v=ID), shortened (youtu.be/ID), or embed (youtube.com/embed/ID)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)

  return (match && match[2].length === 11) ? match[2] : null
})

// Constructs official Youtube Embed Endpoint
const embedUrl = computed(() => {
  return videoId.value ? `https://www.youtube.com/embed/${videoId.value}?rel=0` : null
})
</script>

<style scoped>
.video-viewer {
  width: 100%;
}
</style>