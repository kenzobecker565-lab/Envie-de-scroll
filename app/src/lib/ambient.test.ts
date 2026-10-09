import { afterEach, describe, expect, it, vi } from 'vitest'

async function setup({ blocked = false, suspended = false, stored = {} as Record<string, string> } = {}) {
 vi.resetModules()
 const values = new Map(Object.entries(stored))
 const win = new EventTarget()
 const doc = new EventTarget()
 const audios: FakeAudio[] = []
 let rejectPlay = blocked
 let keepSuspended = suspended
 class FakeAudio {
  src: string; loop = false; preload = ''; paused = true; volume = 1
  constructor(src: string) { this.src = src; audios.push(this) }
  play = vi.fn(async () => { if (rejectPlay) throw new Error('NotAllowedError'); this.paused = false })
  pause = vi.fn(() => { this.paused = true })
 }
 const ramp = vi.fn()
 class FakeContext extends EventTarget {
  state = suspended ? 'suspended' : 'running'; currentTime = 0; destination = {}
  resume = vi.fn(async () => { if (!keepSuspended) { this.state = 'running'; this.dispatchEvent(new Event('statechange')) } })
  createGain() { return { gain: { value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: ramp }, connect: () => ({}) } }
  createMediaElementSource() { return { connect: () => ({ connect: () => ({}) }) } }
 }
 Object.assign(win, { localStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string,v: string) => values.set(k,v) }, AudioContext: FakeContext, clearTimeout, setTimeout })
 Object.assign(doc, { visibilityState: 'visible' })
 vi.stubGlobal('window', win); vi.stubGlobal('document', doc); vi.stubGlobal('Audio', FakeAudio)
 const ambient = await import('./ambient.ts')
 const settle = async () => { for (let n=0;n<5;n++) await Promise.resolve() }
 return { ambient, win, doc, audios, ramp, values, settle, allow: () => { rejectPlay = false; keepSuspended = false } }
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
describe('signature music startup', () => {
 it('starts the signature without waiting for a gesture when allowed', async () => {
  const t=await setup();t.ambient.initAmbient();await t.settle()
  expect(t.audios[0]!.src).toBe('/music/le-grand-defile.mp3');expect(t.audios[0]!.paused).toBe(false);expect(t.ramp).toHaveBeenCalledWith(.32,1.2)
  t.ambient.initAmbient();expect(t.audios).toHaveLength(1)
 })
 it('retries blocked autoplay on a real gesture', async () => {
  const t=await setup({blocked:true});t.ambient.initAmbient();await t.settle();expect(t.audios[0]!.paused).toBe(true)
  t.allow();t.win.dispatchEvent(new Event('pointerdown'));await t.settle();expect(t.audios[0]!.paused).toBe(false)
 })
 it('unlocks a suspended Web Audio context even if media.play succeeded', async () => {
  const t=await setup({suspended:true});t.ambient.initAmbient();await t.settle();expect(t.ramp).not.toHaveBeenCalled()
  t.allow();t.win.dispatchEvent(new Event('touchend'));await t.settle();expect(t.ramp).toHaveBeenCalled()
 })
 it('preserves mute and other selected music', async () => {
  const t=await setup({stored:{'scroll-up:music':'off','scroll-up:music-style':'lofi'}});t.ambient.initAmbient();await t.settle()
  expect(t.audios).toHaveLength(0);expect(t.ambient.isAmbientEnabled()).toBe(false)
  t.ambient.setAmbientEnabled(true);await t.settle();expect(t.audios[0]!.src).toBe('/music/lofi.mp3')
 })
 it('adopts the old default once, while allowing jazz to be selected afterward', async () => {
  vi.useFakeTimers();const t=await setup({stored:{'scroll-up:music-style':'jazz'}});t.ambient.initAmbient();await t.settle();expect(t.audios[0]!.src).toBe('/music/le-grand-defile.mp3')
  t.ambient.setAmbiance('jazz');expect(t.values.get('scroll-up:music-style')).toBe('jazz');expect(t.values.get('scroll-up:music-default:v2')).toBe('done');vi.advanceTimersByTime(350);await t.settle();expect(t.audios[0]!.src).toBe('/music/jazz-noir.mp3')
 })
 it('fades away for an activity and restores afterward', async () => {
  vi.useFakeTimers();const t=await setup();t.ambient.initAmbient();await t.settle();const restore=t.ambient.suppressAmbient('piano')
  vi.advanceTimersByTime(1200);expect(t.audios[0]!.paused).toBe(true);restore();await t.settle();expect(t.audios[0]!.paused).toBe(false)
 })
})
