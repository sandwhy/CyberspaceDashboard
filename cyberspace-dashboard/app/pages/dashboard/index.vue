<template>
  <div class="admin-page">
    <!-- Data Dashboard -->
    <div>
      <div class="dashboard-grid">
        <!-- Stats Cards -->
        <div class="stats-card-container">
          <div class="stat-card">
            <div class="stat-icon-wrapper yellow">
              <Users :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Registrations</div>
              <div class="stat-value">{{ registrations.length }}</div>
              <div class="stat-trend positive">
                <TrendingUp :size="14" />
                <span>+12% from last week</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper purple">
              <Zap :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">Active Students</div>
              <div class="stat-value">42</div>
              <div class="stat-trend">
                <span>Current active batch</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <Globe :size="24" />
            </div>
            <div class="stat-info">
              <div class="stat-label">Site Visits</div>
              <div class="stat-value">1,204</div>
              <div class="stat-trend positive">
                <TrendingUp :size="14" />
                <span>+5% today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Section -->
        <div class="table-section">
          <div class="table-header">
            <h3>Recent Registrations</h3>
            <button @click="fetchData" class="btn-refresh" :disabled="isLoading" title="Refresh Data">
              <RefreshCw :size="18" :class="{ 'spin': isLoading }" />
            </button>
          </div>

          <div class="table-card">
            <div v-if="isLoading && registrations.length === 0" class="loading-state">
              <RefreshCw class="spin" :size="30" />
              <p>Loading records...</p>
            </div>

            <div v-else-if="error" class="error-state">
              {{ error }}
            </div>

            <div v-else class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Parent</th>
                    <th>Child</th>
                    <th>Age</th>
                    <th>WhatsApp</th>
                    <th>Source</th>
                    <th>Exp.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reg in registrations" :key="reg.id">
                    <td class="text-muted">#{{ reg.id }}</td>
                    <td>
                      <div class="date-cell">
                        <Calendar :size="14" />
                        {{ formatDate(reg.created_at) }}
                      </div>
                    </td>
                    <td class="font-medium">{{ reg.parent_name }}</td>
                    <td>{{ reg.child_name }}</td>
                    <td>
                      <span class="age-badge">{{ reg.child_age }}</span>
                    </td>
                    <td>
                      <a :href="`https://wa.me/${formatPhone(reg.whatsapp_number)}`" target="_blank" class="wa-link">
                        <MessageCircle :size="14" />
                        {{ reg.whatsapp_number }}
                      </a>
                    </td>
                    <td>
                      <span class="source-tag">{{ reg.info_source }}</span>
                    </td>
                    <td>
                      <span :class="['status-chip', reg.has_prior_experience ? 'active' : 'inactive']">
                        {{ reg.has_prior_experience ? 'Yes' : 'No' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="registrations.length === 0">
                    <td colspan="8" class="text-center empty-state">
                      No registrations found yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <!-- <NuxtLink to="/admin/registrations" class="view-all-link">
                View All Registrations &rarr;
              </NuxtLink> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Users, TrendingUp, RefreshCw, Zap, Globe, Calendar, MessageCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboards'
})

const registrations = ref([])
const isLoading = ref(false)
const error = ref('')

const fetchData = async () => {
  isLoading.value = true
  error.value = ''

  const token = useCookie('token')
  if (!token.value) {
    navigateTo('/login')
    return
  }

  try {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBase}/api/registrations?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (response.status === 401 || response.status === 403) {
      token.value = null
      navigateTo('/login')
      throw new Error('Session expired')
    }

    if (!response.ok) throw new Error('Failed to fetch data')
    registrations.value = await response.json()
  } catch (e) {
    if (e.message !== 'Session expired') error.value = e.message
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const formatPhone = (phone) => {
  let p = phone.replace(/\D/g, '')
  if (p.startsWith('0')) {
    p = '62' + p.substring(1)
  }
  return p
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Login Overlay */
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

:global(html[data-theme="light"]) .login-box {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 2rem;
  color: var(--color-primary);
  font-weight: 800;
  display: block;
  margin-bottom: 10px;
}

.input-group {
  margin-bottom: 16px;
}

.admin-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  font-size: 1rem;
  transition: all 0.2s;
}

:global(html[data-theme="light"]) .admin-input {
  background: #f4f4f5;
  border-color: #e4e4e7;
  color: #18181b;
}

.admin-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: transparent;
}

/* Dashboard Grid */
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.stats-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: var(--color-surface);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

:global(html[data-theme="light"]) .stat-card {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.08);
  /* slight border */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper.yellow {
  background: rgba(255, 215, 53, 0.1);
  color: var(--color-primary);
}

.stat-icon-wrapper.purple {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.stat-icon-wrapper.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.positive {
  color: #22c55e;
}

/* Table Section */
.table-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-refresh {
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-muted);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-primary);
}

:global(html[data-theme="light"]) .btn-refresh {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
}

.table-card {
  background: var(--color-surface);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:global(html[data-theme="light"]) .table-card {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.data-table th {
  text-align: left;
  padding: 16px 24px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.02);
}

:global(html[data-theme="light"]) .data-table th {
  background: #f9fafb;
  border-bottom-color: #e5e7eb;
}

.data-table td {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 0.95rem;
  color: var(--color-text);
}

:global(html[data-theme="light"]) .data-table td {
  border-bottom-color: #f3f4f6;
  color: #374151;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

:global(html[data-theme="light"]) .data-table tr:hover td {
  background: #f9fafb;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.age-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
}

:global(html[data-theme="light"]) .age-badge {
  background: #f3f4f6;
}

.wa-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 215, 53, 0.1);
  border-radius: 8px;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.wa-link:hover {
  background: rgba(255, 215, 53, 0.2);
}

:global(html[data-theme="light"]) .wa-link {
  background: rgba(234, 179, 8, 0.1);
  color: #a16207;
}

:global(html[data-theme="light"]) .wa-link:hover {
  background: rgba(234, 179, 8, 0.2);
}

.source-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

:global(html[data-theme="light"]) .source-tag {
  background: #f3f4f6;
  color: #4b5563;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-chip.active {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

:global(html[data-theme="light"]) .status-chip.active {
  background: #dcfce7;
  color: #166534;
}

.status-chip.inactive {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Table Footer */
.table-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
}

:global(html[data-theme="light"]) .table-footer {
  border-top-color: #e5e7eb;
}

.view-all-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.view-all-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

.empty-state {
  padding: 40px;
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.9rem;
}
</style>
