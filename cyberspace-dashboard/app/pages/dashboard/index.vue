<template>
  <v-container>
    <v-card class="rounded-lg pa-4">
      <v-toolbar color="surface" flat class="mb-4">
        <v-toolbar-title class="text-h6 font-weight-bold">
          Lesson Management
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn color="secondary" variant="outlined" class="mr-2" @click="handleGetPrograms">
          Get Programs
        </v-btn>

        <v-btn color="secondary" variant="outlined" class="mr-2" @click="handleGetLessons">
          Get Lessons
        </v-btn>

        <v-btn color="primary" prepend-icon="mdi-plus" @click="goToCreateLesson">
          Create Lesson
        </v-btn>
      </v-toolbar>

      <v-divider class="mb-4"></v-divider>

      <div>
        <div class="text-subtitle-2 font-weight-medium text-medium-emphasis mb-2">
          Programs & Lesson Count
        </div>

        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="program in programSummary"
            :key="program.id"
            color="primary"
            variant="tonal"
            size="large"
            class="font-weight-medium cursor-pointer"
            @click="navigateTo(`/dashboard/studyprogram/${program.id}`)"
          >
            <v-icon start icon="mdi-school-outline"></v-icon>
            {{ program.title }}
            <v-avatar color="primary" class="ml-2 text-caption">
              {{ program.lessonCount }}
            </v-avatar>
          </v-chip>

          <v-chip v-if="!programSummary.length" color="grey" variant="outlined">
            No programs found. Click "Get Programs" to load.
          </v-chip>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'

definePageMeta({
  layout: 'dashboards'
})

const dataStore = useDataStore()

// Computes lesson count per program from the Pinia/Nuxt store
const programSummary = computed(() => {
  const programs = dataStore.programs || []
  const lessons = dataStore.lessons || []

  return programs.map(program => {
    // Counts lessons belonging to this program (handles string/number ID matching)
    const count = lessons.filter(
      lesson => String(lesson.programId) === String(program.id)
    ).length

    return {
      id: program.id,
      title: program.title || program.name || 'Untitled Program',
      lessonCount: count
    }
  })
})

const handleGetPrograms = async () => {
  console.log('[---handleGetPrograms---]')
  await dataStore.fetchData('programs')
}

const handleGetLessons = async () => {
  console.log('[---handleGetLessons---]')
  await dataStore.fetchData('lessons')
}

// Redirects directly to the createLessons page
const goToCreateLesson = () => {
  navigateTo('/dashboard/createLessons')
}
</script>