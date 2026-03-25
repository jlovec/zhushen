import type { AttachmentMetadata } from './types'
import { isObject } from './utils'
import { unwrapRoleWrappedRecordEnvelope } from './messages'

type CanonicalUserMessageMeta = {
    sentFrom?: 'webapp'
}

type CanonicalUserMessageTextContent = {
    type: 'text'
    text: string
    attachments?: AttachmentMetadata[]
}

export type CanonicalUserMessage = {
    role: 'user'
    content: CanonicalUserMessageTextContent
    meta?: CanonicalUserMessageMeta
}

export function buildCanonicalUserMessage(input: {
    text: string
    attachments?: AttachmentMetadata[]
    sentFrom?: 'webapp'
}): CanonicalUserMessage {
    return {
        role: 'user',
        content: {
            type: 'text',
            text: input.text,
            attachments: input.attachments,
        },
        meta: input.sentFrom ? { sentFrom: input.sentFrom } : undefined,
    }
}

export function parseCanonicalUserMessage(value: unknown): CanonicalUserMessage | null {
    const record = unwrapRoleWrappedRecordEnvelope(value)
    if (!record || record.role !== 'user') return null
    if (!isCanonicalUserMessageTextContent(record.content)) return null
    if (!isCanonicalUserMessageMeta(record.meta)) return null

    return {
        role: 'user',
        content: {
            type: 'text',
            text: record.content.text,
            attachments: record.content.attachments,
        },
        meta: record.meta,
    }
}

function isCanonicalUserMessageTextContent(value: unknown): value is CanonicalUserMessageTextContent {
    if (!isObject(value)) return false
    if (value.type !== 'text') return false
    if (typeof value.text !== 'string') return false
    if ('attachments' in value && value.attachments !== undefined && !Array.isArray(value.attachments)) return false
    return true
}

function isCanonicalUserMessageMeta(value: unknown): value is CanonicalUserMessageMeta | undefined {
    if (value === undefined) return true
    if (!isObject(value)) return false
    if ('sentFrom' in value && value.sentFrom !== undefined && value.sentFrom !== 'webapp') return false
    return true
}
