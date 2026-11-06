import type { NotificationService } from '../types'
import { demoActor } from './actor'
import { demoDb } from './db'
import { copy, delay, ok } from './shared'

const inbox = () => demoDb.notifications[demoActor.id] ?? []

export const demoNotificationService: NotificationService = {
  async list() {
    await delay(250)
    return ok(copy([...inbox()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  },
  async markRead(id) {
    const found = inbox().find((n) => n.id === id)
    if (found) found.read = true
    return ok(null)
  },
  async markAllRead() {
    inbox().forEach((n) => (n.read = true))
    return ok(null)
  },
}
