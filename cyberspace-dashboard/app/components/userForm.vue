<template>
  <v-dialog v-model="showDialog" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-6 pb-0 d-flex align-center justify-space-between">
        <h3 class="text-h5 font-weight-bold">Edit User Account</h3>
        <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row density="comfortable">
          <v-col cols="12">
            <v-text-field
              v-model="localUser.username"
              label="Username"
              variant="outlined"
              prepend-inner-icon="mdi-account"
              readonly
              disabled
              hint="Username cannot be changed"
              persistent-hint
              class="mb-6"
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-select
              v-model="localUser.role_name"
              :items="roles"
              item-title="title"
              item-value="value"
              label="User Role"
              variant="outlined"
              prepend-inner-icon="mdi-shield-account"
              hide-details
            ></v-select>
            <p class="text-caption text-grey-darken-1 mt-2 px-1">
              Assigning a role determines what the user can see in the Data Hub.
            </p>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <!-- ================================================================= -->
        <!-- DEVELOPER NOTE: If you want to disable an inactive user           -->
        <!-- (prevent reactivation), delete this block.                        -->
        <!-- ================================================================= -->
        <v-btn 
          v-if="localUser.status === 'inactive'"
          color="success" 
          variant="text" 
          prepend-icon="mdi-account-check-outline"
          @click="reactivateUser"
        >
          Reactivate User
        </v-btn>
        <!-- ================================================================= -->

        <v-btn 
          v-else
          color="error" 
          variant="text" 
          prepend-icon="mdi-account-off-outline"
          @click="deleteConfirmDialog = true"
        >
          Deactivate User
        </v-btn>
        
        <v-spacer></v-spacer>
        
        <v-btn variant="text" @click="showDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" @click="save">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card class="rounded-lg pa-4">
        <v-card-title class="text-h6 text-error">Deactivate User?</v-card-title>
        <v-card-text>
          Are you sure you want to deactivate <b>{{ localUser.username }}</b>? 
          This will revoke their access immediately.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="remove">Confirm Deactivation</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  userData: Object
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const deleteConfirmDialog = ref(false)
const localUser = ref({ ...props.userData })

const roles = [
  { title: 'Operator', value: 1 },
  { title: 'Admin', value: 2 },
  { title: 'Teacher', value: 3 },
  { title: 'Unregistered', value: 4 }
]

const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(() => props.userData, (newVal) => {
  localUser.value = { ...newVal }
}, { deep: true })

const save = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value

  try {
    const res = await fetch(`${config.public.apiBase}/api/users/${localUser.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        role_id: localUser.value.role_name,
        status: localUser.value.status 
      })
    })

    if (res.ok) {
      emit('saved')
      showDialog.value = false
    }
  } catch (err) {
    console.error("User Update Error:", err)
  }
}

// DEVELOPER NOTE: Part of the reactivation block
const reactivateUser = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value

  try {
    const res = await fetch(`${config.public.apiBase}/api/users/${localUser.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        role_id: localUser.value.role_name,
        status: 'active' 
      })
    })

    if (res.ok) {
      emit('saved')
      showDialog.value = false
    }
  } catch (err) {
    console.error("User Reactivation Error:", err)
  }
}

const remove = async () => {
  const config = useRuntimeConfig()
  const token = useCookie('token').value

  try {
    const res = await fetch(`${config.public.apiBase}/api/users/${localUser.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      emit('deleted')
      deleteConfirmDialog.value = false
      showDialog.value = false
    }
  } catch (err) {
    console.error("User Deactivation Error:", err)
  }
}
</script>