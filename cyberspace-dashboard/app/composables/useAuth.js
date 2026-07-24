import { jwtDecode } from "jwt-decode"
 
// composables/useAuth.js
export const useAuth = () => {
  const token = useCookie('token').value // Pulls { username, role } set during login
  let role = 'unregistered'
  let user = null

  if (token && typeof token === 'string') {
    try {
      user = jwtDecode(token)
      role = user?.role?.toLowerCase() || 'unregistered'
    } catch (e) {
      console.error('Failed to decode JWT token:', e)
      role = 'unregistered'
    }
  }

  return {
    user,
    role,
    isOperator: role === 'operator',
    isAdmin:    role === 'admin',
    isTeacher:  role === 'teacher',
    isPending:  role === 'unregistered',
    
    // Helper for complex checks
    canManageUsers: ['operator', 'admin'].includes(role)
  }
}