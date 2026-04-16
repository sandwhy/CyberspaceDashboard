<template>
  <div class="admin-wrapper" :class="{ 'collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <span class="logo-icon"></span>
        <span v-if="!isSidebarCollapsed" class="logo-text"> <img src="/logo/Cyberspace.png" alt="Cyberspace"
            class="logo-img" />
        </span>
      </div>

      <nav class="sidebar-menu">
        <NuxtLink to="/dashboard/" class="metric-item" active-class="active" title="Dashboard">
          <FileText :size="20" />
          <span v-if="!isSidebarCollapsed">Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/schedules" class="metric-item" active-class="active" title="Schedules">
          <Calendar :size="20" />
          <span v-if="!isSidebarCollapsed">Schedules</span>
        </NuxtLink>
        <NuxtLink to="/dashboard/datahub" class="metric-item" active-class="active" title="Reports">
          <Table2 :size="20" />
          <span v-if="!isSidebarCollapsed">Data Hub</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <a href="/" target="_blank" class="metric-item" title="View Site">
          <ExternalLink :size="20" />
          <span v-if="!isSidebarCollapsed">View Site</span>
        </a>
        <div class="metric-item logout" @click="handleLogout" title="Logout">
          <LogOut :size="20" />
          <span v-if="!isSidebarCollapsed">Logout</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-content">
      <header class="admin-topbar">
        <div class="topbar-left">
          <button @click="isSidebarCollapsed = !isSidebarCollapsed" class="toggle-btn">
            <Menu :size="20" />
          </button>
          <h2 class="page-title">{{ $route.meta.title || 'Overview' }}</h2>
        </div>

        <div class="topbar-right">
          <button @click="toggleTheme" class="icon-btn" title="Toggle Theme">
            <Sun v-if="isDarkMode" :size="20" />
            <Moon v-else :size="20" />
          </button>
          
          <div class="admin-profile">
            <div class="admin-avatar" :class="userRole.toLowerCase()">
              {{ userInitial }}
            </div>
            <div class="admin-info d-flex flex-column">
              <span class="admin-name">{{ userName }}</span>
              <span class="admin-role">{{ userRole }}</span>
            </div>
          </div>
        </div>
      </header>
      <div class="content-body">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue' // Added computed
  import { ExternalLink, LogOut, Sun, Moon, Menu, FileText, Calendar, Table2 } from 'lucide-vue-next'

  const isDarkMode = ref(true)
  const isSidebarCollapsed = ref(false)
  const user = useCookie('user') // Access the user cookie

  // 1. Get the Username (fallback to 'Guest')
  const userName = computed(() => user.value?.username || 'Guest')

  // 2. Get the Initial for the Avatar
  const userInitial = computed(() => {
    return user.value?.username ? user.value.username.charAt(0).toUpperCase() : '?'
  })

  // 3. Get the Role (Operator, Admin, Teacher, or Unregistered)
  const userRole = computed(() => {
    const role = user.value?.role
    if (!role) return 'Unregistered'
    // Capitalize first letter (e.g., 'teacher' -> 'Teacher')
    return role.charAt(0).toUpperCase() + role.slice(1)
  })

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    if (isDarkMode.value) {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = () => {
    const token = useCookie('token')
    const userCookie = useCookie('user')
    token.value = null
    userCookie.value = null
    navigateTo('/login')
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      isDarkMode.value = false
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  })
</script>

<style scoped>
.admin-wrapper {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-text);
  font-family: 'Outfit', sans-serif;
  transition: all 0.3s ease;
}

.admin-sidebar {
  width: 180px;
  background: var(--admin-sidebar-bg);
  border-right: 1px solid var(--admin-border-color);
  display: flex;
  flex-direction: column;
  padding: 24px;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  transition: width 0.3s ease;
}

.admin-sidebar.collapsed {
  width: 80px;
  padding: 24px 12px;
  align-items: center;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding: 0 12px;
  height: 48px;
}

.admin-sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
}

.logo-icon {
  color: var(--color-primary);
  font-weight: 900;
  font-size: 1.8rem;
  letter-spacing: -2px;
}

.logo-text {
  font-weight: 700;
  font-size: 1.4rem;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  /* Override global nav style */
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--color-text-muted);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
}

.admin-sidebar.collapsed .metric-item {
  padding: 12px;
  justify-content: center;
}

.metric-item:hover,
.metric-item.active {
  background: var(--admin-active-item-bg);
  color: var(--admin-active-item-text);
}

.metric-item.logout {
  margin-top: auto;
}

.metric-item.logout:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 180px;
  width: calc(100% - 260px);
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.admin-wrapper.collapsed .admin-content {
  margin-left: 80px;
  width: calc(100% - 80px);
}

.admin-topbar {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  border-bottom: 1px solid var(--admin-border-color);
  background: var(--admin-header-bg);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 40;
  transition: background-color 0.3s, border-color 0.3s;
}

/* Specific light mode override removed, relying on variables */
:global(html[data-theme="light"]) .admin-topbar {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.05);
}

:global(html[data-theme="light"]) .toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  color: var(--color-primary);
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.admin-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}

.admin-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Dynamic Avatar Gradients based on Role */
.admin-avatar.operator {
  background: linear-gradient(135deg, #4f46e5, #06b6d4); /* Blue/Cyan */
}

.admin-avatar.admin {
  background: linear-gradient(135deg, #f59e0b, #ef4444); /* Orange/Red */
}

.admin-avatar.teacher {
  background: linear-gradient(135deg, #10b981, #3b82f6); /* Green/Blue */
}

.admin-avatar.unregistered {
  background: linear-gradient(135deg, #9ca3af, #4b5563); /* Grey */
  box-shadow: none;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #ffc300);
  color: #000;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(255, 215, 53, 0.3);
}

.admin-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.content-body {
  flex: 1;
  padding: 32px 40px;
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    width: 180px;
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .admin-content {
    margin-left: 0;
    width: 100%;
  }

  .admin-topbar {
    padding: 0 20px;
  }

  .content-body {
    padding: 20px;
  }

  .metric-item span {
    display: inline;
  }

  .admin-name {
    display: none;
  }
}
</style>
