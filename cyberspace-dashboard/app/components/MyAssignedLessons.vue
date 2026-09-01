<template>
  <v-container>
    <v-card class="rounded-lg pa-4">
      <v-divider class="mb-4"></v-divider>

      <div>
        <div class="text-subtitle-2 font-weight-medium text-medium-emphasis mb-2">
          Your Training Roster (Linear Progression)
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
          <!-- Sequence Column -->
          <template v-slot:item.sequence="{ item }">
            <v-chip size="small" color="primary" label class="font-weight-bold">
              #{{ item.sequence }}
            </v-chip>
          </template>

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

          <!-- Actions Column: Do Lessons Button with Prerequisite & Status Locks -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              v-if="item.isLocked"
              color="grey"
              variant="outlined"
              size="small"
              prepend-icon="mdi-lock"
              disabled
            >
              Locked (Complete Previous Active)
            </v-btn>
            <v-btn
              v-else-if="item.lesson_status === 'inactive'"
              color="warning"
              variant="outlined"
              size="small"
              disabled
            >
              Inactive Program
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-book-open-page-variant"
              class="font-weight-bold text-none"
              @click="goToStudyProgram(item.id)"
            >
              Do Lessons
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
  { title: 'Seq', align: 'start', key: 'sequence', width: '80px' },
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

    // 2. Fetch user's certificates
    const certRes = await fetch(`${config.public.apiBase}/api/certificates/my-certificates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const certData = await certRes.json()
    const certificates = certData.data || []

    // 3. Map records and check against the nearest preceding ACTIVE program
    const mappedRecords = records.map((prog, index, arr) => {
      const matchingCert = certificates.find(c => Number(c.program_id) === Number(prog.id))

      let isLocked = false
      let lockReason = ''

      if (index > 0) {
        // Find the nearest preceding ACTIVE program, skipping inactive ones
        let prevActiveProg = null
        for (let i = index - 1; i >= 0; i--) {
          if (arr[i].lesson_status === 'active') {
            prevActiveProg = arr[i]
            break
          }
        }

        // If an active predecessor exists, check if it's completed or has a certificate
        if (prevActiveProg) {
          const prevHasCert = certificates.some(c => Number(c.program_id) === Number(prevActiveProg.id))
          const prevIsCompleted = Boolean(prevActiveProg.is_completed)

          if (!prevHasCert && !prevIsCompleted) {
            isLocked = true
            lockReason = 'Complete previous active program'
          }
        }
      }

      return {
        id: prog.id,
        sequence: prog.sequence || index + 1,
        title: prog.title || 'Untitled Program',
        description: prog.description,
        lesson_status: prog.lesson_status || 'active',
        isCompleted: Boolean(prog.is_completed),
        isLocked: isLocked,
        lockReason: lockReason,
        certificateIssuedAt: matchingCert ? matchingCert.issued_at : null,
        certificateCode: matchingCert ? matchingCert.certificate_code : null
      }
    })

    assignedPrograms.value = mappedRecords
  } catch (err) {
    console.error('Error fetching assigned programs hub:', err)
  } finally {
    isLoading.value = false
  }
}

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