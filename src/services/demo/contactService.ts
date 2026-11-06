import type { ContactService } from '../types'
import { delay, notConnected } from './shared'

export const demoContactService: ContactService = {
  async submitMessage() {
    await delay()
    return notConnected('The contact form')
  },
}
