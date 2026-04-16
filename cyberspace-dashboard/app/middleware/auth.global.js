export default defineNuxtRouteMiddleware((to) => {
  const { isPending } = useAuth()
  const token = useCookie('token').value
  const publicRoutes = ['/login', '/register']

  // 1. If not logged in at all, send to Login
  if (!token && !publicRoutes.includes(to.path)) {
      return navigateTo('/login')
  }

  // 2. If registered but 'pending' approval, redirect to login with error param
  if (isPending.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login?error=pending')
  }
})