import { describe, expect, it } from 'vitest'
import { SessionChat } from '@/components/SessionChat'
import { SessionChatPanel } from './SessionChatPanel'

describe('SessionChatPanel', () => {
    it('re-exports SessionChat as a compatibility alias', () => {
        expect(SessionChatPanel).toBe(SessionChat)
    })
})
