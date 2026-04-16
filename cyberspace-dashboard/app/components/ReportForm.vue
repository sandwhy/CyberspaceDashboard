<template>
  <v-dialog v-model="showDialog" max-width="80vw" persistent>
    <v-card class="rounded-lg">
      <div class="pa-6 pb-0 d-flex align-center justify-space-between">
        <h3 class="text-h5 font-weight-bold">
          {{ isEdit ? 'Update Session Report' : 'Submit Session Report' }}
        </h3>
        <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
      </div>

      <v-card-text class="pa-6">
        <v-row density="comfortable">
          <v-col cols="12" sm="6">
            <v-text-field v-model="localReport.program" label="Program" variant="outlined" readonly bg-color="grey-darken-3" prepend-inner-icon="mdi-school" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="localReport.module" label="Module" variant="outlined" readonly bg-color="grey-darken-3" prepend-inner-icon="mdi-book-open-variant" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="localReport.invoice_number" label="Invoice Number" variant="outlined" prepend-inner-icon="mdi-file-certificate" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-col cols="12" sm="4">
            <v-text-field v-model="localReport.total_student_attendance" label="Attendance Count" type="number" variant="outlined" prepend-inner-icon="mdi-account-group" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="8">
            <v-text-field v-model="localReport.students_name" label="Student Names" placeholder="Nara, Nicklaus, Geoffrey..." variant="outlined" prepend-inner-icon="mdi-account-details" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-divider class="my-2 w-100"></v-divider>

          <v-col cols="12" sm="4">
            <v-text-field v-model="localReport.date" label="Date" type="date" bg-color="grey-darken-3" variant="outlined" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model="localReport.time_start" label="Start" type="time" bg-color="grey-darken-3" variant="outlined" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model="localReport.time_end" label="End" type="time" bg-color="grey-darken-3" variant="outlined" hide-details="auto" class="mb-4"></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-file-input
              v-model="imageFile"
              label="Session Photo"
              variant="outlined"
              prepend-inner-icon="mdi-camera"
              accept="image/*"
              hide-details="auto"
              @update:model-value="createPreview"
              class="mb-4"
            ></v-file-input>

            <v-img
              v-if="imagePreview"
              :src="imagePreview"
              max-height="200"
              class="rounded-lg mb-4 border"
              cover
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                </div>
              </template>
            </v-img>
          </v-col>

          <v-col cols="12">
            <v-textarea v-model="localReport.summary" label="Session Summary" variant="outlined" placeholder="What did the students achieve today?" rows="3" prepend-inner-icon="mdi-text-box-check" hide-details="auto"></v-textarea>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn v-if="isEdit" color="error" variant="text" prepend-icon="mdi-trash-can-outline" @click="deleteConfirmDialog = true">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" @click="save">
          {{ isEdit ? 'Update Report' : 'Submit Report' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card class="rounded-lg pa-4">
        <v-card-title class="text-h6">Delete Report?</v-card-title>
        <v-card-text>This will remove the session record from the database.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="remove">Confirm Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
  const props = defineProps({
    modelValue: Boolean,
    isEdit: Boolean,
    reportData: Object // This will be the Schedule object if creating a new report
  })

  const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

  const deleteConfirmDialog = ref(false)
  const localReport = ref({})

  const imageFile = ref(null)
  const imagePreview = ref(null)

  const showDialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // Sync logic: Maps Schedule fields to Report fields
  watch(() => props.reportData, (newVal) => {
    if (props.isEdit) {
      localReport.value = { ...newVal }
    } else {
      // PRE-FILL: Link to IDs and copy session details from Schedule
      localReport.value = {
        schedule_id: newVal.id,
        teacher_id: newVal.teacher_id,
        program: newVal.program,
        module: newVal.module,
        date: newVal.date,
        time_start: newVal.time_start,
        time_end: newVal.time_end,
        invoice_number: 'INV-2026-',
        total_student_attendance: 0,
        students_name: '',
        summary: ''
      }
    }
  }, { deep: true, immediate: true })

  function createPreview(file) {
    // 1. If the user clears the input, revert to the existing image (if any)
    if (!file) {
      const config = useRuntimeConfig()
      imagePreview.value = localReport.value.image_url 
        ? `${config.public.apiBase}${localReport.value.image_url}` 
        : null
      return
    }
    
    // 2. Generate a local "temporary path" to show the image in the UI
    imagePreview.value = URL.createObjectURL(file)
  }

  watch(() => props.reportData, (newVal) => {
    const config = useRuntimeConfig()
    
    // CRITICAL: Clear any previously selected file from the last session
    imageFile.value = null 

    if (props.isEdit) {
      localReport.value = { ...newVal }
      // If editing, show the photo already stored on the server
      imagePreview.value = newVal.image_url ? `${config.public.apiBase}${newVal.image_url}` : null
    } else {
      // 1. "Map" the schedule details into a new report object
      localReport.value = {
        schedule_id: newVal.id,      // Link to the calendar event
        teacher_id: newVal.teacher_id,
        program: newVal.program,
        module: newVal.module,
        date: newVal.date ? newVal.date.split('T')[0] : '', // Format for <v-text-field type="date">
        time_start: newVal.time_start,
        time_end: newVal.time_end,
        invoice_number: 'INV-2026-', // Pre-fill prefix for convenience
        total_student_attendance: 0,
        students_name: '',
        summary: ''
      }
      imagePreview.value = null
    }
  }, { deep: true, immediate: true })

const save = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value
  
  // 1. Initialize the FormData object
  const fd = new FormData()
  
  // 2. Loop through our report fields and "stuff" them into the envelope
  Object.keys(localReport.value).forEach(key => {
    if (localReport.value[key] !== null) {
      fd.append(key, localReport.value[key])
    }
  })
  
  // 3. Add the image file if the teacher selected one
  if (imageFile.value) {
    fd.append('image', imageFile.value) // This must match upload.single('image') in your backend
  }

  const url = props.isEdit 
    ? `${config.public.apiBase}/api/reports/${localReport.value.id}` 
    : `${config.public.apiBase}/api/reports`

    console.log("FormData as Object:", Object.fromEntries(fd));
    
    try {
      const res = await fetch(url, {
        method: props.isEdit ? 'PUT' : 'POST',
        headers: { 
          // IMPORTANT: Do NOT set Content-Type. The browser does it for you.
          'Authorization': `Bearer ${token}` 
        },
        body: fd // We send the FormData object instead of a JSON string
      })
      
      if (res.ok) {
        emit('saved')
        showDialog.value = false
      }
    } catch (err) { 
      console.error("Report Save Error:", err) 
    }
  }

  const remove = async () => {
    const config = useRuntimeConfig()
    const token = useCookie('token').value
    try {
      const res = await fetch(`${config.public.apiBase}/api/reports/${localReport.value.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        emit('deleted')
        deleteConfirmDialog.value = false
        showDialog.value = false
      }
    } catch (err) { console.error("Report Delete Error:", err) }
  }
</script>