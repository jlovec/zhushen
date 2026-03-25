import { describe, expect, it } from 'vitest'
import { normalizeDecryptedMessage } from './normalize'
import type { DecryptedMessage } from '@/types/api'

describe('normalizeDecryptedMessage', () => {
    it('prefers canonical user-message parsing', () => {
        const message: DecryptedMessage = {
            id: 'msg-1',
            seq: 1,
            localId: 'local-1',
            createdAt: 123,
            content: {
                role: 'user',
                content: {
                    type: 'text',
                    text: 'hello',
                    attachments: [{
                        id: 'att-1',
                        filename: 'a.txt',
                        mimeType: 'text/plain',
                        size: 1,
                        path: '/tmp/a.txt',
                    }],
                },
                meta: {
                    sentFrom: 'webapp',
                },
            },
        }

        expect(normalizeDecryptedMessage(message)).toEqual({
            id: 'msg-1',
            localId: 'local-1',
            createdAt: 123,
            role: 'user',
            isSidechain: false,
            content: {
                type: 'text',
                text: 'hello',
                attachments: [{
                    id: 'att-1',
                    filename: 'a.txt',
                    mimeType: 'text/plain',
                    size: 1,
                    path: '/tmp/a.txt',
                }],
            },
            meta: {
                sentFrom: 'webapp',
            },
            status: undefined,
            originalText: undefined,
        })
    })

    it('parses canonical user-message shape without metadata via the canonical path', () => {
        const message: DecryptedMessage = {
            id: 'msg-canonical-no-meta',
            seq: 2,
            localId: null,
            createdAt: 234,
            content: {
                role: 'user',
                content: {
                    type: 'text',
                    text: 'hello without meta',
                    attachments: [{
                        id: 'att-2',
                        filename: 'b.txt',
                        mimeType: 'text/plain',
                        size: 2,
                        path: '/tmp/b.txt',
                    }],
                },
            },
        }

        expect(normalizeDecryptedMessage(message)).toEqual({
            id: 'msg-canonical-no-meta',
            localId: null,
            createdAt: 234,
            role: 'user',
            isSidechain: false,
            content: {
                type: 'text',
                text: 'hello without meta',
                attachments: [{
                    id: 'att-2',
                    filename: 'b.txt',
                    mimeType: 'text/plain',
                    size: 2,
                    path: '/tmp/b.txt',
                }],
            },
            meta: undefined,
            status: undefined,
            originalText: undefined,
        })
    })

    it('falls back to legacy user normalization', () => {
        const message: DecryptedMessage = {
            id: 'msg-2',
            seq: 2,
            localId: null,
            createdAt: 456,
            content: {
                role: 'user',
                content: 'legacy hello',
            },
        }

        expect(normalizeDecryptedMessage(message)).toEqual({
            id: 'msg-2',
            localId: null,
            createdAt: 456,
            role: 'user',
            isSidechain: false,
            content: {
                type: 'text',
                text: 'legacy hello',
            },
            meta: undefined,
            status: undefined,
            originalText: undefined,
        })
    })
})
