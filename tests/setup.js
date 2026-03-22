import { afterEach, vi } from 'vitest'

afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
  }
  vi.restoreAllMocks()
})
