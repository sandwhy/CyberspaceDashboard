<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    max-width="500px"
  >
    <v-card>
      <v-card-title class="pt-4 px-4">
        Assign Teachers
        <div class="text-subtitle-2 text-grey">{{ program?.title }}</div>
      </v-card-title>
      
      <v-card-text class="pt-4">
        <v-autocomplete
          v-model="selectedTeacherIds"
          :items="availableTeachers"
          item-title="name"
          item-value="id"
          label="Select Teachers"
          multiple
          chips
          closable-chips
          variant="outlined"
          placeholder="Search for a teacher..."
          :loading="dataStore.isLoading" hide-no-data
          hide-selected
        ></v-autocomplete>
      </v-card-text>
      
      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog" :disabled="isSaving">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveTeachers" :loading="isSaving">Save Roster</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
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
const dataStore = useDataStore() // Initialize the Pinia Store

// 2. Reactive State
const selectedTeacherIds = ref([])
const isSaving = ref(false)

// 3. Computed Data from Store (Replaces local fetch logic)
const availableTeachers = computed(() => {
  // Filters out unregistered users, allowing admins/operators/teachers to be assigned
  return dataStore.users.filter(u => u.role_name && u.role_name !== 'unregistered')
})

// 4. Watchers & Lifecycle
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // Populate the dropdown with existing assigned teachers when modal opens
    selectedTeacherIds.value = props.currentTeachers.map(t => t.id)

    // Conditional Fetching: Only fetch users if the store doesn't already have them
    if (dataStore.users.length === 0) {
      try {
        await dataStore.fetchData('users')
      } catch (error) {
        console.error('Failed to load users from store:', error)
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
    // Dynamic URL mapping replacing hardcoded localhost
    const url = `${config.public.apiBase}/api/programs/${props.program.id}/teachers`
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ teacherIds: selectedTeacherIds.value })
    })

    const data = await res.json()

    if (data.success) {
      // Rebuild the selected teacher objects from your computed list to pass back to the parent
      const updatedTeacherObjects = availableTeachers.value.filter(teacher => 
        selectedTeacherIds.value.includes(teacher.id)
      )
      
      // Tell the parent the save was successful and pass the new data
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