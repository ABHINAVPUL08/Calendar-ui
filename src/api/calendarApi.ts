import type { AvailabilityBlock, CalendarEvent } from '../types'

type MutationResult<T> = Promise<{ ok: true; data: T }>

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

// API adapter layer: replace internals with real fetch/axios calls later.
export const calendarApi = {
  async createAvailability(blocks: AvailabilityBlock[]): MutationResult<AvailabilityBlock[]> {
    await wait(220)
    return { ok: true, data: blocks }
  },
  async updateAvailability(block: AvailabilityBlock): MutationResult<AvailabilityBlock> {
    await wait(180)
    return { ok: true, data: block }
  },
  async deleteAvailability(ids: string[]): MutationResult<string[]> {
    await wait(180)
    return { ok: true, data: ids }
  },
  async createEvent(event: CalendarEvent): MutationResult<CalendarEvent> {
    await wait(180)
    return { ok: true, data: event }
  },
  async updateEvent(event: CalendarEvent): MutationResult<CalendarEvent> {
    await wait(180)
    return { ok: true, data: event }
  },
  async deleteEvent(event: CalendarEvent): MutationResult<string> {
    await wait(160)
    return { ok: true, data: event.id }
  },
}
