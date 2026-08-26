<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    max-width="500px"
  >
    <v-card>
      <v-card-title class="pt-4 px-4">
        Assign Teachers
        <div class="text-subtitle-2 text-grey">{{ program?.title || program?.program_title }}</div>
      </v-card-title>
      
      <v-card-text class="pt-4">
        <!-- Loading State -->
        <div v-if="dataStore.isLoading" class="text-grey text-caption mb-4">Loading teachers...</div>
        
        <template v-else>
          <!-- 1. Assigned Teachers Section (Top) -->
          <div class="text-subtitle-2 mb-2 text-medium-emphasis">Assigned Teachers</div>
          <div 
            class="d-flex ga-2 pa-3 mb-4 rounded overflow-x-auto custom-scrollbar" 
            style="min-height: 60px; border: 1px dashed #ccc; background-color: #f9f9f9;"
          >
            <v-chip
              v-for="teacher in assignedTeachersList"
              :key="'assigned-' + teacher.id"
              class="font-weight-medium flex-shrink-0"
              color="black"
              variant="flat"
              closable
              @click:close="removeTeacher(teacher.id)"
              @click="removeTeacher(teacher.id)"
            >
              {{ teacher.username || teacher.name }}
            </v-chip>

            <div v-if="assignedTeachersList.length === 0" class="text-grey text-caption d-flex align-center w-100 justify-center">
              No teachers currently assigned.
            </div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <!-- 2. Available Teachers Section (Bottom) -->
          <div class="text-subtitle-2 mb-2 text-medium-emphasis">Available to Assign</div>
          <div class="d-flex ga-2 overflow-x-auto custom-scrollbar pb-2">
            <v-chip
              v-for="teacher in unassignedTeachersList"
              :key="'available-' + teacher.id"
              class="font-weight-medium flex-shrink-0"
              color="primary"
              variant="outlined"
              style="cursor: pointer;"
              @click="addTeacher(teacher.id)"
            >
              <v-icon start icon="mdi-plus" size="small"></v-icon>
              {{ teacher.username || teacher.name }}
            </v-chip>

            <div v-if="unassignedTeachersList.length === 0 && availableTeachers.length > 0" class="text-grey text-caption mt-1">
              All available teachers have been assigned.
            </div>
          </div>
        </template>
      </v-card-text>
      
      <v-card-actions class="px-4 pb-4 mt-2">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog" :disabled="isSaving">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveTeachers" :loading="isSaving">Save Roster</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  program: Object,
  currentTeachers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

// 1. Logic Imports
const dataStore = useDataStore()

// 2. Reactive State
const selectedTeacherIds = ref([])
const isSaving = ref(false)

// 3. Computed Data
const availableTeachers = computed(() => {
  return dataStore.users.filter(u => u.role_name && u.role_name !== 'unregistered')
})

const assignedTeachersList = computed(() => {
  return availableTeachers.value.filter(t => selectedTeacherIds.value.includes(t.id))
})

const unassignedTeachersList = computed(() => {
  return availableTeachers.value.filter(t => !selectedTeacherIds.value.includes(t.id))
})

// Movement Actions
const addTeacher = (teacherId) => {
  if (!selectedTeacherIds.value.includes(teacherId)) {
    selectedTeacherIds.value.push(teacherId)
  }
}

const removeTeacher = (teacherId) => {
  const index = selectedTeacherIds.value.indexOf(teacherId)
  if (index !== -1) {
    selectedTeacherIds.value.splice(index, 1)
  }
}

// 4. Watchers & Lifecycle
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    if (dataStore.users.length === 0) {
      try {
        await dataStore.fetchData('users')
      } catch (error) {
        console.error('Failed to load users from store:', error)
      }
    }

    if (props.program) {
      const storeAssignments = dataStore.lessonsAssignment?.filter(
        a => a.program_id === props.program.id || a.id === props.program.id
      ) || []
      
      if (storeAssignments.length > 0 && storeAssignments[0].teacher_id) {
        selectedTeacherIds.value = storeAssignments.map(a => a.teacher_id)
      } 
      else if (props.program.assigned_teachers && typeof props.program.assigned_teachers === 'string') {
        const assignedNames = props.program.assigned_teachers.split(',').map(n => n.trim())
        selectedTeacherIds.value = availableTeachers.value
          .filter(t => assignedNames.includes(t.username) || assignedNames.includes(t.name))
          .map(t => t.id)
      } 
      else {
        selectedTeacherIds.value = props.currentTeachers.map(t => t.id)
      }
    }
  }
})

const closeDialog = () => {
  emit('update:modelValue', false)
}

// 5. API Actions
const saveTeachers = async () => {
  if (!props.program) return
  isSaving.value = true

  const config = useRuntimeConfig()
  const token = useCookie('token').value

  try {
    const url = `${config.public.apiBase}/api/lessonsAssignment/program/${props.program.id}`
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      // Matches the teacherIds array expected by your Express route
      body: JSON.stringify({ teacherIds: selectedTeacherIds.value })
    })

    const data = await res.json()

    if (data.success || res.ok) {
      const updatedTeacherObjects = availableTeachers.value.filter(teacher => 
        selectedTeacherIds.value.includes(teacher.id)
      )
      
      emit('saved', {
        programId: props.program.id,
        teachers: updatedTeacherObjects
      })
      
      closeDialog()
    } else {
      console.error('Failed to update roster:', data.message)
      alert(data.message || 'Failed to update roster')
    }
  } catch (error) {
    console.error('API Error saving teachers:', error)
  } finally {
    isSaving.value = false
  }
}
</script>