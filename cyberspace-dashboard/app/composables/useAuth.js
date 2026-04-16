// composables/useAuth.js
export const useAuth = () => {
  const user = useCookie('user') // Pulls { username, role } set during login

  const role = computed(() => user.value?.role?.toLowerCase() || 'unregistered')

  
  return {
    user,
    role,
    isOperator: computed(() => role.value === 'operator'),
    isAdmin:    computed(() => role.value === 'admin'),
    isTeacher:  computed(() => role.value === 'teacher'),
    isPending:  computed(() => role.value === 'unregistered'),
    
    // Helper for complex checks
    canManageUsers: computed(() => ['operator', 'admin'].includes(role.value))
  }
}