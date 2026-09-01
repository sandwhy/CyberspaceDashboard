<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    max-width="600px"
  >
    <v-card>
      <v-card-title class="pt-4 px-4">
        Assign Programs Sequence
        <div class="text-subtitle-2 text-grey">Teacher: {{ teacher?.username || teacher?.name }}</div>
      </v-card-title>
      
      <v-card-text class="pt-4">
        <div v-if="isLoading" class="text-grey text-caption mb-4">Loading assigned programs...</div>
        
        <template v-else>
          <!-- 1. Assigned Programs List (Sequenced) -->
          <div class="text-subtitle-2 mb-2 text-medium-emphasis">Assigned Curriculum Sequence</div>
          <div class="d-flex flex-column ga-2 pa-3 mb-4 rounded border bg-grey-lighten-4" style="min-height: 80px;">
            <div 
              v-for="(item, index) in assignedPrograms" 
              :key="'assigned-' + item.program_id"
              class="d-flex align-center justify-between pa-2 bg-surface rounded border"
            >
              <div class="d-flex align-center ga-3">
                <v-chip size="small" color="primary" label class="font-weight-bold">#{{ index + 1 }}</v-chip>
                <span class="font-weight-medium text-body-2">{{ item.title }}</span>
              </div>
              
              <div class="d-flex align-center ga-1">
                <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="index === 0" @click="moveUp(index)" />
                <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="index === assignedPrograms.length - 1" @click="moveDown(index)" />
                <v-btn icon="mdi-delete-outline" color="error" size="x-small" variant="text" @click="removeProgram(index)" />
              </div>
            </div>

            <div v-if="assignedPrograms.length === 0" class="text-grey text-caption text-center py-3">
              No programs assigned to this teacher yet.
            </div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <!-- 2. Available Programs Section -->
          <div class="text-subtitle-2 mb-2 text-medium-emphasis">Available Programs to Add</div>
          <div class="d-flex ga-2 overflow-x-auto pb-2">
            <v-chip
              v-for="prog in unassignedPrograms"
              :key="'available-' + prog.id"
              class="font-weight-medium flex-shrink-0"
              color="primary"
              variant="outlined"
              style="cursor: pointer;"
              @click="addProgram(prog)"
            >
              <v-icon start icon="mdi-plus" size="small"></v-icon>
              {{ prog.title }}
            </v-chip>
          </div>
        </template>
      </v-card-text>
      
      <v-card-actions class="px-4 pb-4 mt-2">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog" :disabled="isSaving">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveAssignments" :loading="isSaving">Save Sequence</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  teacher: Object // Selected teacher object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const dataStore = useDataStore()
const config = useRuntimeConfig()

const assignedPrograms = ref([])
const isLoading = ref(false)
const isSaving = ref(false)

const availablePrograms = computed(() => {
  return dataStore.programs || []
})

const unassignedPrograms = computed(() => {
  const assignedIds = assignedPrograms.value.map(p => p.program_id)
  return availablePrograms.value.filter(p => !assignedIds.includes(p.id))
})

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.teacher) {
    isLoading.value = true
    if (dataStore.programs.length === 0) {
      await dataStore.fetchData('programs')
    }
    
    try {
      const token = useCookie('token').value
      const res = await fetch(`${config.public.apiBase}/api/lessonsAssignment/teacher/${props.teacher.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const records = data.data || []
      
      assignedPrograms.value = records.map((r, idx) => ({
        program_id: r.program_id,
        title: r.program_title,
        sequence: r.sequence || idx + 1
      }))
    } catch (err) {
      console.error('Failed to fetch teacher assignments:', err)
      assignedPrograms.value = []
    } finally {
      isLoading.value = false
    }
  }
})

const addProgram = (prog) => {
  assignedPrograms.value.push({
    program_id: prog.id,
    title: prog.title,
    sequence: assignedPrograms.value.length + 1
  })
}

const removeProgram = (index) => {
  assignedPrograms.value.splice(index, 1)
}

const moveUp = (index) => {
  if (index > 0) {
    const temp = assignedPrograms.value[index]
    assignedPrograms.value[index] = assignedPrograms.value[index - 1]
    assignedPrograms.value[index - 1] = temp
  }
}

const moveDown = (index) => {
  if (index < assignedPrograms.value.length - 1) {
    const temp = assignedPrograms.value[index]
    assignedPrograms.value[index] = assignedPrograms.value[index + 1]
    assignedPrograms.value[index + 1] = temp
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const saveAssignments = async () => {
  if (!props.teacher) return
  isSaving.value = true
  const token = useCookie('token').value

  try {
    const payloadPrograms = assignedPrograms.value.map((item, index) => ({
      program_id: item.program_id,
      sequence: index + 1
    }))

    const res = await fetch(`${config.public.apiBase}/api/lessonsAssignment/teacher/${props.teacher.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ programs: payloadPrograms })
    })

    const data = await res.json()
    if (res.ok && data.success) {
      emit('saved')
      closeDialog()
    } else {
      alert(data.message || 'Failed to save curriculum sequence.')
    }
  } catch (err) {
    console.error('API Error saving sequence:', err)
  } finally {
    isSaving.value = false
  }
}
</script>