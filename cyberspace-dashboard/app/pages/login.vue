<template>
  <v-container fluid class="fill-height bg-grey-darken-2" style="padding-top: 5%;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-8 rounded-xl elevation-24" theme="dark" color="#1e1e1e">
          <div class="text-center mb-6">
            <img src="/logo/Cyberspace.png" alt="Cyberspace" style="height: 60px;" class="mb-4" />
            <h1 class="text-h4 font-weight-bold text-white">Welcome Back</h1>
            <p class="text-grey-lighten-1">Login to your staff portal</p>
          </div>

          <v-alert v-if="isPendingUser" type="warning" variant="tonal" class="mb-6 border">
            Your account is <strong>pending approval</strong>. Please wait for an Admin to assign your role.
          </v-alert>

          <v-form @submit.prevent="handleLogin">
            <v-text-field
              v-model="username"
              label="Username"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              color="orange-darken-2"
              class="mb-2"
              required
            ></v-text-field>

            <v-text-field
              v-model="password"
              label="Password"
              prepend-inner-icon="mdi-lock"
              type="password"
              variant="outlined"
              color="orange-darken-2"
              class="mb-4"
              required
            ></v-text-field>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
              {{ error }}
            </v-alert>

            <v-btn
              type="submit"
              block
              size="x-large"
              color="#f66b1d"
              class="rounded-pill font-weight-bold"
              :loading="isLoading"
            >
              Login
            </v-btn>
          </v-form>

          <div class="text-center mt-6">
            <span class="text-grey">New here? </span>
            <NuxtLink to="/register" class="text-orange-darken-2 font-weight-bold text-decoration-none">Create Account</NuxtLink>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({ layout: false })
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

// Captures 'pending' status from auth.global.js
const isPendingUser = computed(() => route.query.error === 'pending')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const config = useRuntimeConfig()
    const res = await fetch(`${config.public.apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    const data = await res.json()
    if (res.ok && data.success) {
      const token = useCookie('token', { maxAge: 28800 })
      token.value = data.token
      const user = useCookie('user', { maxAge: 28800 })
      user.value = { username: data.username, role: data.role }
      router.push('/dashboard')
    } else {
      error.value = data.message || 'Invalid credentials'
    }
  } catch (e) {
    error.value = 'Network error'
  } finally {
    isLoading.value = false
  }
}
</script>