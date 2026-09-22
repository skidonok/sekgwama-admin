import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  api,
  getErrorCode,
  getErrorMessage,
  setAdminOnlyHandler,
  setAuthToken,
  setUnauthorizedHandler,
} from '../services/api'

const REFRESH_TOKEN_KEY = 'sekgwama_admin_refresh_token'
const SESSION_ID_KEY = 'sekgwama_admin_session_id'

const deviceInfo = () => ({
  platform: 'web',
  deviceName: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-admin',
})

export const useAuthStore = defineStore('auth', () => {
  // idToken is kept in memory only, never persisted - refreshToken/sessionId
  // are persisted in localStorage so a page reload can silently re-derive a
  // fresh idToken via /auth/refresh-token.
  const idToken = ref(null)
  const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY))
  const sessionId = ref(localStorage.getItem(SESSION_ID_KEY))
  const user = ref(null)

  // 'idle' -> bootstrapping hasn't run yet; 'checking' -> restoring session;
  // 'authenticated' / 'unauthenticated' are the settled states the router
  // guard reads.
  const status = ref('idle')

  // Pending MFA challenge, set after a login response with mfaRequired: true.
  const mfaChallenge = ref(null) // { challengeToken, method, fallback }

  // Message to surface once on the login screen (e.g. after an ADMIN_ONLY
  // logout triggered mid-session by some other request).
  const notice = ref(null)

  const isAuthenticated = computed(() => status.value === 'authenticated')

  const persistSession = (tokens, session) => {
    idToken.value = tokens.idToken
    setAuthToken(tokens.idToken)
    refreshToken.value = tokens.refreshToken
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    if (session) {
      sessionId.value = session
      localStorage.setItem(SESSION_ID_KEY, session)
    }
  }

  const clearSession = () => {
    idToken.value = null
    setAuthToken(null)
    refreshToken.value = null
    sessionId.value = null
    user.value = null
    mfaChallenge.value = null
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(SESSION_ID_KEY)
  }

  // Confirms the freshly-authenticated account actually has admin access
  // before letting it into the dashboard. Reuses the audit-verify endpoint
  // (admin-gated) with a minimal date range purely as an access check.
  const checkAdminAccess = async () => {
    const to = new Date()
    const from = new Date(to.getTime() - 60 * 1000)
    await api.get('/admin/audit/verify', {
      params: { from: from.toISOString(), to: to.toISOString() },
    })
  }

  const finishLogin = async ({ user: loggedInUser, tokens, sessionId: newSessionId }) => {
    persistSession(tokens, newSessionId)
    user.value = loggedInUser
    mfaChallenge.value = null

    try {
      await checkAdminAccess()
    } catch (err) {
      const adminOnly = getErrorCode(err) === 'ADMIN_ONLY'
      clearSession()
      status.value = 'unauthenticated'
      const message = adminOnly ? "You don't have admin access." : getErrorMessage(err)
      const error = new Error(message)
      error.isAdminOnly = adminOnly
      throw error
    }

    status.value = 'authenticated'
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password, deviceInfo: deviceInfo() })
    const data = res.data.data
    if (data.mfaRequired) {
      mfaChallenge.value = {
        challengeToken: data.mfaChallengeToken,
        method: data.mfaMethod,
        fallback: data.mfaFallback,
      }
      return { mfaRequired: true, mfaMethod: data.mfaMethod, mfaFallback: data.mfaFallback }
    }
    await finishLogin(data)
    return { mfaRequired: false }
  }

  const verifyMfa = async (code) => {
    if (!mfaChallenge.value) throw new Error('No MFA challenge in progress.')
    const res = await api.post('/auth/mfa/verify', {
      mfaChallengeToken: mfaChallenge.value.challengeToken,
      code,
      deviceInfo: deviceInfo(),
    })
    await finishLogin(res.data.data)
  }

  // Attempts a silent refresh using the persisted refreshToken/sessionId.
  // Used both on app bootstrap (page reload) and as the axios "unauthorized
  // handler" that retries a single 401 once.
  const refreshSession = async () => {
    if (!refreshToken.value || !sessionId.value) return null
    try {
      const res = await api.post('/auth/refresh-token', {
        refreshToken: refreshToken.value,
        sessionId: sessionId.value,
      })
      persistSession(res.data.data, sessionId.value)
      return idToken.value
    } catch {
      clearSession()
      status.value = 'unauthenticated'
      return null
    }
  }

  const logout = async () => {
    try {
      if (idToken.value && sessionId.value) {
        await api.post('/auth/logout', { sessionId: sessionId.value })
      }
    } catch {
      // best-effort - the session is being torn down client-side regardless
    }
    clearSession()
    status.value = 'unauthenticated'
  }

  // Called once on app start to restore a session across page reloads.
  const bootstrap = async () => {
    if (status.value !== 'idle') return
    status.value = 'checking'
    const token = await refreshSession()
    if (!token) {
      status.value = 'unauthenticated'
      return
    }
    try {
      const res = await api.get('/auth/me')
      user.value = res.data.data
      status.value = 'authenticated'
    } catch (err) {
      clearSession()
      status.value = 'unauthenticated'
      if (getErrorCode(err) === 'ADMIN_ONLY') {
        notice.value = "You don't have admin access."
      }
    }
  }

  // Handles an ADMIN_ONLY 403 surfacing from any admin-gated call made after
  // login (not just the initial gate check) - logs out and lets the router
  // guard bounce back to /login, where the notice is shown once.
  const handleAdminOnlyDenial = () => {
    notice.value = "You don't have admin access."
    clearSession()
    status.value = 'unauthenticated'
  }

  const consumeNotice = () => {
    const value = notice.value
    notice.value = null
    return value
  }

  setUnauthorizedHandler(refreshSession)
  setAdminOnlyHandler(handleAdminOnlyDenial)

  return {
    user,
    status,
    isAuthenticated,
    mfaChallenge,
    login,
    verifyMfa,
    refreshSession,
    logout,
    bootstrap,
    handleAdminOnlyDenial,
    consumeNotice,
  }
})
