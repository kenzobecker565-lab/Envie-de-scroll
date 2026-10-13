const KEY = 'scroll-up-device-v1'
export function isDeviceMode(): boolean {
  if (new URLSearchParams(window.location.search).get('android') === '1') return true
  try { return localStorage.getItem(KEY) !== null } catch { return false }
}
export function deviceAuthorization(storage: Pick<Storage, 'getItem'|'setItem'>, random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>): string {
  let token = storage.getItem(KEY)
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = Array.from(random(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('')
    storage.setItem(KEY, token)
  }
  return `device ${token}`
}
