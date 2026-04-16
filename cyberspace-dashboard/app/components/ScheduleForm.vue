<template>
  <v-dialog v-model="showDialog" max-width="80vw" persistent>
    <v-card class="rounded-lg">
      <div class="pa-6 pb-0 d-flex align-center justify-space-between">
        <h3 class="text-h5 font-weight-bold">
          {{ isEdit ? 'Edit Schedule' : 'New Schedule' }}
        </h3>
        <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
      </div>

      <v-card-text class="pa-6">
        <v-row density="comfortable">
          <v-col cols="12" sm="6">
            <v-combobox
              v-model="localEvent.program"
              :items="programList"
              item-title="title"
              item-value="title"
              label="Program"
              variant="outlined"
              prepend-inner-icon="mdi-school"
              hide-details="auto"
              class="mb-4"
              :loading="isProgramsLoading"
              :return-object="false"
              hint="Select a program or type a new one"
              persistent-hint
            ></v-combobox>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="localEvent.module" label="Module" variant="outlined" prepend-inner-icon="mdi-book-open-variant" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="localEvent.location" label="Location" variant="outlined" prepend-inner-icon="mdi-map-marker" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="localEvent.teacher_id"
                :items="teacherList"
                item-title="username"
                item-value="id"
                label="Select a Staff Member"
                variant="outlined"
                prepend-inner-icon="mdi-account-search"
                :loading="isLoading"
                placeholder="Search by name..."
                class="mb-4"
                style="max-width: 450px;"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item 
                    v-bind="props" 
                    :subtitle="'Role: ' + (item?.role_name || 'N/A') + ' | DB ID: ' + (item?.id || '???')"
                  ></v-list-item>
                </template>
              </v-autocomplete>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="localEvent.date" label="Date" type="date" variant="outlined" prepend-inner-icon="mdi-calendar" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="localEvent.color" label="Event Color" type="color" variant="outlined" prepend-inner-icon="mdi-palette" hide-details="auto" class="mb-4" style="height: 56px;"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="localEvent.time_start" label="Start Time" type="time" variant="outlined" prepend-inner-icon="mdi-clock-start" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="localEvent.time_end" label="End Time" type="time" variant="outlined" prepend-inner-icon="mdi-clock-end" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <div class="text-subtitle-2 mb-3 font-weight-bold text-grey-darken-2 d-flex align-center">
              <v-icon start size="small" color="primary">mdi-repeat</v-icon> Recurring Schedule
            </div>
            <v-row density="comfortable">
              <v-col cols="12" sm="6">
                <v-select v-model="localEvent.repeat_frequency" :items="['None', 'Weekly', 'Bi-weekly']" label="Frequency" variant="outlined" density="compact" hide-details="auto"></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="localEvent.repeat_until" :disabled="localEvent.repeat_frequency === 'None'" label="Repeat Until" type="date" variant="outlined" density="compact" hide-details="auto" :min="localEvent.date"></v-text-field>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" v-if="isEdit && localEvent.freq_id">
            <v-divider class="my-4"></v-divider>
            <div class="text-subtitle-2 mb-2 font-weight-bold text-primary">
              Update Options
            </div>
            <v-radio-group v-model="updateMode" inline hide-details>
              <v-radio label="This session only" value="single"></v-radio>
              <v-radio label="This and following sessions" value="following"></v-radio>
            </v-radio-group>
            <v-alert v-if="updateMode === 'following'" type="info" variant="tonal" density="compact" class="mt-2" style="font-size: 0.8rem;">
              Changes will apply to all future sessions in this series.
            </v-alert>
          </v-col>
          <v-col cols="12" class="mt-4">
            <v-textarea v-model="localEvent.notes" label="Notes" variant="outlined" prepend-inner-icon="mdi-note-text" rows="2" hide-details="auto"></v-textarea>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn v-if="isEdit" color="error" variant="text" prepend-icon="mdi-trash-can-outline" @click="deleteConfirmDialog = true">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" @click="save">
          {{ isEdit ? 'Save Changes' : 'Create Schedule' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card class="rounded-lg pa-4">
        <v-card-title class="text-h6">Confirm Delete?</v-card-title>
        <v-card-text>Are you sure you want to delete this schedule? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="remove">Yes, Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>

    // Inside <script setup> in ScheduleForm.vue

    const programList = ref([])
    const isProgramsLoading = ref(false)

    // Fetch programs from the database
    const fetchPrograms = async () => {
      isProgramsLoading.value = true
      const config = useRuntimeConfig()
      const token = useCookie('token').value
      try {
        const res = await fetch(`${config.public.apiBase}/api/programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        // We only want active programs for the selection
        programList.value = data.filter(p => p.is_active === 1)
      } catch (err) {
        console.error("Failed to load programs:", err)
      } finally {
        isProgramsLoading.value = false
      }
    }

  // 1. Logic Imports
  const { isTeacher, user } = useAuth()
  
  const props = defineProps({
    modelValue: Boolean,
    isEdit: Boolean,
    eventData: Object
  })
  const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

  // 2. Reactive State
  const teacherList = ref([])
  const isLoading = ref(false)
  const deleteConfirmDialog = ref(false)
  const localEvent = ref({ ...props.eventData })
  const updateMode = ref('single')

  const showDialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 3. API Actions
  const fetchTeachers = async () => {
    isLoading.value = true
    const config = useRuntimeConfig()
    const token = useCookie('token').value
    try {
      const res = await fetch(`${config.public.apiBase}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      teacherList.value = data.filter(u => u.role_name && u.role_name !== 'unregistered')
    } catch (err) {
      console.error("Fetch failed:", err)
    } finally {
      isLoading.value = false
    }
  }

  // 4. Watchers & Lifecycle
    watch(() => props.modelValue, (isOpen) => {
      if (isOpen) {
        fetchTeachers() // Your existing function
        fetchPrograms() // New function
      }
    })

  watch(() => props.eventData, (newVal) => {
    localEvent.value = { ...newVal }
    
    // 1. ADD SAFETY: Check if 'user' and 'user.value' exist before accessing .id
    if (isTeacher.value && !props.isEdit && user?.value) {
      localEvent.value.teacher_id = user.value.id 
    }
  }, { deep: true, immediate: true })

  const save = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value
  const url = props.isEdit 
    ? `${config.public.apiBase}/api/schedules/${localEvent.value.id}` 
    : `${config.public.apiBase}/api/schedules`

  const payload = {
    ...localEvent.value,
    mode: updateMode.value 
  }

  console.log('sent:', JSON.stringify(payload))

  try {
    const res = await fetch(url, {
      method: props.isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      emit('saved')
      showDialog.value = false
    } else {
      const errorData = await res.json()
      alert(errorData.message || "Save failed")
    }
  } catch (err) {
    console.error("Save error:", err)
  }
}

  const remove = async () => {
    const config = useRuntimeConfig()
    const token = useCookie('token').value
    
    // NEW: Pass mode and freq info as query parameters for the DELETE route
    const queryParams = new URLSearchParams({
      mode: updateMode.value,
      freq_id: localEvent.value.freq_id || '',
      date: localEvent.value.date
    }).toString()

    const url = `${config.public.apiBase}/api/schedules/${localEvent.value.id}?${queryParams}`

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        emit('deleted')
        deleteConfirmDialog.value = false
        showDialog.value = false
      } else {
        const errorData = await res.json()
        alert(errorData.message || "Delete failed")
      }
    } catch (err) {
      console.error("Delete error:", err)
    }
  }
</script>