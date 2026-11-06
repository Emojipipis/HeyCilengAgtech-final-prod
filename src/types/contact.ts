export type ContactTopic = 'general' | 'selling' | 'buying' | 'partnership' | 'press'

export interface ContactMessageInput {
  name: string
  email: string
  organisation?: string
  topic: ContactTopic
  message: string
}
