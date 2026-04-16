<template>
  <v-container fluid class="fill-height bg-grey-darken-2" style="padding-top: 5%;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card class="rounded-xl overflow-hidden elevation-24" theme="dark" color="#1e1e1e">
          <v-row no-gutters>
            <v-col cols="12" md="4" class="bg-orange-darken-4 pa-8 d-none d-md-flex flex-column justify-center text-center">
              <v-icon size="80" color="white" class="mb-4">mdi-shield-account</v-icon>
              <h2 class="text-h4 font-weight-black text-white mb-2">Join Cyberspace</h2>
              <p class="text-body-1 text-white opacity-80">Submit your registration to access the staff dashboard.</p>
            </v-col>

            <v-col cols="12" md="8" class="pa-10">
              <div class="mb-6">
                <NuxtLink to="/login" class="text-orange-darken-2 text-decoration-none text-body-2">
                  <v-icon start size="small">mdi-arrow-left</v-icon> Return to Login
                </NuxtLink>
              </div>
              
              <h1 class="text-h4 font-weight-bold mb-2">Staff Registration</h1>
              <p class="text-grey-lighten-1 mb-8">Fill in your details to request access.</p>

              <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-6">{{ successMsg }}</v-alert>
              <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-6">{{ errorMsg }}</v-alert>

              <v-form @submit.prevent="handleRegister">
                <v-text-field
                  v-model="form.username"
                  label="Username"
                  variant="outlined"
                  color="orange-darken-2"
                  class="mb-2"
                  placeholder="Choose a username"
                ></v-text-field>

                <v-text-field
                  v-model="form.password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  color="orange-darken-2"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="form.confirmPassword"
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  color="orange-darken-2"
                  class="mb-6"
                ></v-text-field>

                <v-btn
                  type="submit"
                  block
                  size="x-large"
                  color="#f66b1d"
                  class="rounded-pill font-weight-bold mb-4"
                  :loading="isLoading"
                >
                  Request Access
                </v-btn>
              </v-form>

              <p class="text-center text-body-2 text-grey">
                Already registered? <NuxtLink to="/login" class="text-orange-darken-2 font-weight-bold text-decoration-none">Login here</NuxtLink>
              </p>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: false })
const config = useRuntimeConfig()
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = ref({ username: '', password: '', confirmPassword: '' })

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = "Passwords do not match."
    return
  }

  try {
    isLoading.value = true
    const res = await fetch(`${config.public.apiBase}/api/register-staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.value.username, password: form.value.password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Registration failed')

    successMsg.value = "Registration successful! Redirecting you to login..."
    form.value = { username: '', password: '', confirmPassword: '' }
    
    // Smooth transition to login to show the 'pending' status
    setTimeout(() => navigateTo('/login?error=pending'), 2500)
    
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>