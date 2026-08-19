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
          Programs Overview
        </div>

        <v-data-table
          :headers="headers"
          :items="programSummary"
          :items-per-page="5"
          hover
          class="bg-transparent"
        >
          <template v-slot:item.lesson_status="{ item }">
            <v-chip :color="getStatusColor(item.lesson_status)" size="small" class="text-uppercase font-weight-bold">
              {{ item.lesson_status || 'draft' }}
            </v-chip>
          </template>
          
          <template v-slot:item.lessonCount="{ item }">
            <v-chip size="small" variant="tonal">
              {{ item.lessonCount }} Lessons
            </v-chip>
          </template>

          <template v-slot:item.teachers="{ item }">
            <div v-if="item.teachers && item.teachers.length > 0" class="d-flex flex-wrap">
              <v-chip v-for="teacher in item.teachers" :key="teacher.id" size="x-small" color="info" variant="flat" class="ma-1">
                {{ teacher.name }}
              </v-chip>
            </div>
            <span v-else class="text-caption text-grey">Unassigned</span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip text="Edit Assigned Teachers" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-account-edit"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="openTeacherEditor(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <AssignTeacherDialog 
      v-model="editDialog" 
      :program="selectedProgram" 
      @saved="handleTeachersSaved" 
    />

  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'

definePageMeta({ layout: 'dashboards' })

const dataStore = useDataStore()

const programSummary = computed(() => {
  const programs = dataStore.programs || []
  const lessons = dataStore.lessons || []

  return programs.map(program => {
    const count = lessons.filter(
      lesson => String(lesson.programId) === String(program.id)
    ).length

    return {
      id: program.id,
      title: program.title || program.name || 'Untitled Program',
      lessonCount: count,
      lesson_status: program.lesson_status, 
      // teachers: program.teachers 
    }
  })
})

const handleGetPrograms = async () => await dataStore.fetchData('programs')
const handleGetLessons = async () => await dataStore.fetchData('lessons')
const goToCreateLesson = () => navigateTo('/dashboard/createLessons')

const headers = [
  { title: 'Program Title', align: 'start', key: 'title' },
  { title: 'Status', align: 'center', key: 'lesson_status' },
  { title: 'Content Size', align: 'center', key: 'lessonCount' },
  // { title: 'Assigned Teachers', align: 'start', key: 'teachers', sortable: false },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false },
]

// Modal State
const editDialog = ref(false)
const selectedProgram = ref(null)

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'draft': default: return 'grey'
  }
}

const openTeacherEditor = (program) => {
  selectedProgram.value = program
  editDialog.value = true
}

// Update Pinia store immediately when the child component emits a success event
const handleTeachersSaved = ({ programId, teachers }) => {
  const programInStore = dataStore.programs.find(p => p.id === programId)
  if (programInStore) {
    programInStore.teachers = teachers
  }
}
</script>