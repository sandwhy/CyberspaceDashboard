<template>
  <v-dialog v-model="showDialog" max-width="600px" persistent>
    <v-card class="rounded-lg">
      <div class="pa-6 pb-0 d-flex align-center justify-space-between">
        <h3 class="text-h5 font-weight-bold">
          {{ isEdit ? 'Edit Program' : 'New Program' }}
        </h3>
        <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
      </div>

      <v-card-text class="pa-6">
        <v-row density="comfortable">
          <v-col cols="12">
            <v-sheet 
              border 
              rounded="lg" 
              class="pa-4 d-flex align-center justify-space-between mb-2"
              :color="localProgram.is_active ? 'green-lighten-5' : 'grey-lighten-4'"
            >
              <div>
                <div class="text-subtitle-2 font-weight-bold" :class="localProgram.is_active ? 'text-green-darken-3' : 'text-grey-darken-3'">
                  Program Visibility
                </div>
                <div class="text-caption">
                  {{ localProgram.is_active ? 'This program is live and visible on the site.' : 'This program is hidden from public view.' }}
                </div>
              </div>
              <v-switch
                v-model="localProgram.is_active"
                color="success"
                :true-value="1"
                :false-value="0"
                hide-details
              ></v-switch>
            </v-sheet>
          </v-col>

          <v-col cols="12">
            <v-text-field v-model="localProgram.title" label="Program Title" variant="outlined" prepend-inner-icon="mdi-robot" hide-details="auto"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="localProgram.age_range" label="Age Range" variant="outlined" prepend-inner-icon="mdi-account-group" hide-details="auto"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model.number="localProgram.sort_order" label="Sort Order" type="number" variant="outlined" prepend-inner-icon="mdi-sort-numeric-ascending" hide-details="auto"></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-textarea v-model="localProgram.description" label="Description" variant="outlined" rows="3" prepend-inner-icon="mdi-text-subject" hide-details="auto"></v-textarea>
          </v-col>

          <v-col cols="12">
            <v-file-input
              v-model="imageFile"
              label="Program Thumbnail"
              variant="outlined"
              prepend-inner-icon="mdi-camera"
              accept="image/*"
              hide-details="auto"
              @update:model-value="createPreview"
              class="mb-2"
            ></v-file-input>

            <v-img
              v-if="imagePreview"
              :src="imagePreview"
              max-height="180"
              class="rounded-lg border bg-grey-lighten-4"
              contain
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
              </template>
            </v-img>
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field v-model="localProgram.icon" label="Icon (MDI)" placeholder="mdi-robot" variant="outlined" prepend-inner-icon="mdi-emoticon-outline" hide-details="auto"></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="localProgram.bg_color"
              :items="['bg-primary', 'bg-secondary', 'bg-info', 'bg-success', 'bg-warning', 'bg-error']"
              label="Background Theme"
              variant="outlined"
              prepend-inner-icon="mdi-palette"
              hide-details="auto"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn v-if="isEdit" color="error" variant="text" prepend-icon="mdi-trash-can-outline" @click="deleteConfirmDialog = true">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" :loading="isSaving" @click="save">
          {{ isEdit ? 'Update Program' : 'Create Program' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card class="rounded-lg pa-4 text-center">
        <v-icon color="error" size="48" class="mb-2">mdi-alert-circle</v-icon>
        <v-card-title class="text-h6 justify-center">Delete Program?</v-card-title>
        <v-card-text>This action is permanent and will remove "{{ localProgram.title }}" from the system.</v-card-text>
        <v-card-actions class="justify-center">
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="px-6" @click="remove">Confirm Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  isEdit: Boolean,
  programData: Object
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const isSaving = ref(false)
const deleteConfirmDialog = ref(false)
const localProgram = ref({})

// Image Upload State
const imageFile = ref(null)
const imagePreview = ref(null)

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Image Preview logic
function createPreview(file) {
  if (!file) {
    const config = useRuntimeConfig()
    imagePreview.value = localProgram.value.image_url 
      ? `${config.public.apiBase}${localProgram.value.image_url}` 
      : null
    return
  }
  imagePreview.value = URL.createObjectURL(file)
}

// Watcher to sync data
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    const config = useRuntimeConfig()
    imageFile.value = null // Reset file input
    
    if (props.isEdit) {
      localProgram.value = { ...props.programData }
      imagePreview.value = props.programData.image_url 
        ? `${config.public.apiBase}${props.programData.image_url}` 
        : null
    } else {
      localProgram.value = {
        title: '',
        age_range: '',
        description: '',
        icon: 'mdi-robot',
        bg_color: 'bg-primary',
        sort_order: 1,
        is_active: 1
      }
      imagePreview.value = null
    }
  }
})

const save = async () => {
  isSaving.value = true
  const config = useRuntimeConfig()
  const token = useCookie('token').value
  
  // Create FormData for file upload
  const fd = new FormData()
  Object.keys(localProgram.value).forEach(key => {
    if (localProgram.value[key] !== null) {
      fd.append(key, localProgram.value[key])
    }
  })
  
  if (imageFile.value) {
    fd.append('image', imageFile.value) 
  }

  const url = props.isEdit 
    ? `${config.public.apiBase}/api/programs/${localProgram.value.id}` 
    : `${config.public.apiBase}/api/programs`
  
    console.log("FormData as Object:", Object.fromEntries(fd));

  try {
    const res = await fetch(url, {
      method: props.isEdit ? 'PUT' : 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd // Browser handles Content-Type
    })

    if (res.ok) {
      emit('saved')
      showDialog.value = false
    }
  } catch (err) {
    console.error("Save error:", err)
  } finally {
    isSaving.value = false
  }
}

const remove = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value
  try {
    const res = await fetch(`${config.public.apiBase}/api/programs/${localProgram.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      emit('deleted')
      deleteConfirmDialog.value = false
      showDialog.value = false
    }
  } catch (err) {
    console.error("Delete error:", err)
  }
}
</script>