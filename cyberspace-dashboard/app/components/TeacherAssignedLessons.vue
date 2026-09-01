<template>
  <v-container>
    <v-card class="rounded-lg pa-4">
      <v-divider class="mb-4"></v-divider>

      <div>
        <div class="text-subtitle-2 font-weight-medium text-medium-emphasis mb-2">
          Your Training Roster
        </div>
        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-refresh" @click="fetchAssignedPrograms">
          Refresh Hub
        </v-btn>

        <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />

        <v-data-table
          v-else
          :headers="headers"
          :items="assignedPrograms"
          :items-per-page="5"
          hover
          class="bg-transparent"
        >
          <!-- Program Title Column -->
          <template v-slot:item.title="{ item }">
            <div class="font-weight-bold text-body-2">{{ item.title || 'Untitled Program' }}</div>
            <div class="text-caption text-grey">{{ item.description || 'No description provided.' }}</div>
          </template>

          <!-- Status Column -->
          <template v-slot:item.lesson_status="{ item }">
            <v-chip :color="getStatusColor(item.lesson_status)" size="small" class="text-uppercase font-weight-bold">
              {{ item.lesson_status || 'draft' }}
            </v-chip>
          </template>

          <!-- Certificate Status / Action Column -->
          <template v-slot:item.certificate="{ item }">
            <!-- If certificate exists, show green chip with issue date -->
            <v-chip
              v-if="item.certificateIssuedAt"
              color="success"
              variant="flat"
              size="small"
              prepend-icon="mdi-certificate"
              class="font-weight-medium"
              @click="viewCertificate(item)"
              style="cursor: pointer;"
            >
              Issued: {{ new Date(item.certificateIssuedAt).toLocaleDateString() }}
            </v-chip>
            
            <!-- Otherwise show completed button or pending status -->
            <v-btn
              v-else-if="item.isCompleted"
              color="success"
              variant="flat"
              size="small"
              prepend-icon="mdi-certificate"
              @click="viewCertificate(item)"
            >
              View Certificate
            </v-btn>
            
            <v-chip
              v-else
              color="grey-darken-1"
              variant="outlined"
              size="small"
              class="text-caption"
            >
              Not Yet Complete
            </v-chip>
          </template>

          <!-- Actions Column: Do Lessons Button -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-book-open-page-variant"
              class="font-weight-bold text-none"
              :disabled="item.lesson_status === 'inactive'"
              @click="goToStudyProgram(item.id)"
            >
              {{ item.lesson_status === 'inactive' ? 'Inactive Program' : 'Do Lessons' }}
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'dashboards' })

const router = useRouter()
const config = useRuntimeConfig()

const assignedPrograms = ref([])
const isLoading = ref(false)

const headers = [
  { title: 'Program Info', align: 'start', key: 'title' },
  { title: 'Status', align: 'center', key: 'lesson_status' },
  { title: 'Certificate Status', align: 'center', key: 'certificate', sortable: false },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false },
]

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'draft': default: return 'grey'
  }
}

// Fetch filtered personal assignments and user certificates directly
const fetchAssignedPrograms = async () => {
  isLoading.value = true
  try {
    const token = useCookie('token').value
    
    // 1. Fetch assignments
    const res = await fetch(`${config.public.apiBase}/api/lessonsAssignment/my-assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const records = Array.isArray(data) ? data : (data.data || [])

    // 2. Fetch user's certificates using the token-based endpoint
    const certRes = await fetch(`${config.public.apiBase}/api/certificates/my-certificates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const certData = await certRes.json()
    const certificates = certData.data || []

    // 3. Map records combining assignment metrics and certificate info
    assignedPrograms.value = records.map(prog => {
      // Find a matching certificate for this program
      const matchingCert = certificates.find(c => Number(c.program_id) === Number(prog.id))

      return {
        id: prog.id,
        title: prog.title || 'Untitled Program',
        description: prog.description,
        lesson_status: prog.lesson_status || 'active',
        isCompleted: Boolean(prog.is_completed),
        certificateIssuedAt: matchingCert ? matchingCert.issued_at : null,
        certificateCode: matchingCert ? matchingCert.certificate_code : null
      }
    })
  } catch (err) {
    console.error('Error fetching assigned programs hub:', err)
  } finally {
    isLoading.value = false
  }
}

// Navigation to the study program lesson viewer
const goToStudyProgram = (id) => {
  router.push(`/dashboard/studyprogram/${id}`)
}

const viewCertificate = (item) => {
  alert(`Opening certificate for: ${item.title} (Code: ${item.certificateCode || 'N/A'})`)
}

onMounted(async () => {
  await fetchAssignedPrograms()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}
</style>