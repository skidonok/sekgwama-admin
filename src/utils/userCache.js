import { getUser } from '../services/users'

// Module-level cache so the same uid appearing in several rows (fraud report
// list, support thread list, etc.) only triggers one /admin/users/:uid
// lookup, shared across every UserIdentity instance on the page.
const cache = new Map() // uid -> { promise, data, error }

export const resolveUser = (uid) => {
  if (!uid) return Promise.resolve(null)
  let entry = cache.get(uid)
  if (!entry) {
    entry = { promise: null, data: null, error: null }
    entry.promise = getUser(uid)
      .then((data) => {
        entry.data = data
        return data
      })
      .catch((err) => {
        entry.error = err
        throw err
      })
    cache.set(uid, entry)
  }
  return entry.promise
}
