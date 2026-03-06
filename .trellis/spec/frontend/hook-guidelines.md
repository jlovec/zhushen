# Hook Guidelines

> How hooks are used in this project.

---

## Overview

HAPI Web uses React hooks extensively for state management and side effects. Custom hooks encapsulate business logic, keeping components focused on presentation. Data fetching uses TanStack Query (React Query) with a clear separation between queries and mutations.

**Key patterns**:
- Custom hooks for reusable logic (platform detection, clipboard, auth)
- TanStack Query for server state (queries in `hooks/queries/`, mutations in `hooks/mutations/`)
- Ref-based patterns for stable callbacks and avoiding stale closures
- Non-hook utilities exported alongside hooks when needed

---

## Custom Hook Patterns

### Basic Custom Hook

```typescript
// hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react'
import { usePlatform } from './usePlatform'
import { safeCopyToClipboard } from '@/lib/clipboard'

export function useCopyToClipboard(resetDelay = 1500) {
    const [copied, setCopied] = useState(false)
    const { haptic } = usePlatform()

    const copy = useCallback(async (text: string) => {
        try {
            await safeCopyToClipboard(text)
            haptic.notification('success')
            setCopied(true)
            setTimeout(() => setCopied(false), resetDelay)
            return true
        } catch {
            haptic.notification('error')
            return false
        }
    }, [haptic, resetDelay])

    return { copied, copy }
}
```

Key aspects:
1. Named export (not default)
2. Return object with descriptive keys
3. Use `useCallback` for returned functions
4. Accept configuration parameters with defaults

### Hook + Non-Hook Utility Pattern

When logic needs to be used both inside and outside React components, export both:

```typescript
// hooks/usePlatform.ts
export function usePlatform(): Platform {
    const isTelegram = useMemo(() => isTelegramApp(), [])
    const isTouch = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
        []
    )
    return { isTelegram, isTouch, haptic }
}

// Non-hook version for use outside React components
export function getPlatform(): Platform {
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    return { isTelegram: isTelegramApp(), isTouch, haptic }
}
```

### Ref-Based Stable Callbacks

For complex hooks with many dependencies, use refs to avoid stale closures:

```typescript
// From hooks/useAuth.ts
export function useAuth(authSource: AuthSource | null, baseUrl: string) {
    const [token, setToken] = useState<string | null>(null)
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null)
    const tokenRef = useRef<string | null>(null)

    // Keep ref in sync with state
    const authSourceRef = useRef(authSource)
    authSourceRef.current = authSource
    tokenRef.current = token

    const refreshAuth = useCallback(async (options?: { force?: boolean }) => {
        const currentSource = authSourceRef.current  // Read from ref, not closure
        const currentToken = tokenRef.current
        // ... implementation
    }, [baseUrl])  // Minimal dependencies

    return { token, api, refreshAuth }
}
```

**Why**: Avoids recreating callbacks on every render while ensuring they always read fresh values.

---

## Data Fetching

### TanStack Query Structure

Data fetching is organized into:
- `hooks/queries/` - Read operations (GET requests)
- `hooks/mutations/` - Write operations (POST/PUT/DELETE requests)

### Query Hook Pattern

```typescript
// hooks/queries/useSessions.ts
import { useQuery } from '@tanstack/react-query'
import type { ApiClient } from '@/api/client'
import { queryKeys } from '@/lib/query-keys'

export function useSessions(api: ApiClient | null): {
    sessions: SessionSummary[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<unknown>
} {
    const query = useQuery({
        queryKey: queryKeys.sessions,
        queryFn: async () => {
            if (!api) throw new Error('API unavailable')
            return await api.getSessions()
        },
        enabled: Boolean(api),
    })

    return {
        sessions: query.data?.sessions ?? [],
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : query.error ? 'Failed to load sessions' : null,
        refetch: query.refetch,
    }
}
```

Key aspects:
1. Accept `ApiClient | null` to handle unauthenticated state
2. Use centralized `queryKeys` from `lib/query-keys.ts`
3. Return normalized shape (data, loading, error, refetch)
4. Provide default values for data (e.g., `?? []`)
5. Use `enabled` to prevent queries when dependencies are missing

### Mutation Hook Pattern

```typescript
// hooks/mutations/useSendMessage.ts
import { useMutation } from '@tanstack/react-query'
import { usePlatform } from '@/hooks/usePlatform'

export function useSendMessage(
    api: ApiClient | null,
    sessionId: string | null,
    options?: UseSendMessageOptions
): {
    sendMessage: (text: string, attachments?: AttachmentMetadata[]) => void
    retryMessage: (localId: string) => void
    isSending: boolean
} {
    const { haptic } = usePlatform()

    const mutation = useMutation({
        mutationFn: async (input: SendMessageInput) => {
            if (!api) throw new Error('API unavailable')
            await api.sendMessage(input.sessionId, input.text, input.localId, input.attachments)
        },
        onMutate: async (input) => {
            // Optimistic update
            appendOptimisticMessage(input.sessionId, optimisticMessage)
        },
        onSuccess: (_, input) => {
            updateMessageStatus(input.sessionId, input.localId, 'sent')
            haptic.notification('success')
        },
        onError: (_, input) => {
            updateMessageStatus(input.sessionId, input.localId, 'failed')
            haptic.notification('error')
        },
    })

    const sendMessage = (text: string, attachments?: AttachmentMetadata[]) => {
        if (!api || !sessionId) {
            options?.onBlocked?.(/* reason */)
            haptic.notification('error')
            return
        }
        mutation.mutate({ sessionId, text, localId: makeClientSideId('local'), createdAt: Date.now(), attachments })
    }

    return {
        sendMessage,
        retryMessage,
        isSending: mutation.isPending,
    }
}
```

Key aspects:
1. Use `onMutate` for optimistic updates
2. Use `onSuccess`/`onError` for side effects (haptic feedback, status updates)
3. Wrap mutation in user-friendly functions (`sendMessage`, not `mutate`)
4. Guard against missing dependencies (api, sessionId)
5. Provide callback options for flexibility

### Query Keys

Centralize query keys in `lib/query-keys.ts`:

```typescript
export const queryKeys = {
    sessions: ['sessions'] as const,
    session: (id: string) => ['session', id] as const,
    messages: (sessionId: string) => ['messages', sessionId] as const,
}
```

**Why**: Ensures consistency and makes invalidation easier.

---

## Naming Conventions

### Hook Names

- Always prefix with `use` (e.g., `useAuth`, `useSessions`)
- Use descriptive names that indicate purpose (e.g., `useCopyToClipboard`, not `useClipboard`)
- Query hooks: `use<Resource>` or `use<Resource>s` (e.g., `useSessions`, `useSession`)
- Mutation hooks: `use<Action><Resource>` (e.g., `useSendMessage`, `useSpawnSession`)

### File Names

- Match hook name: `useAuth.ts`, `useSessions.ts`
- One hook per file (unless closely related helpers)
- Place in appropriate directory:
  - `hooks/` - General custom hooks
  - `hooks/queries/` - TanStack Query read operations
  - `hooks/mutations/` - TanStack Query write operations
  - `realtime/hooks/` - Real-time connection hooks

### Return Values

Return objects with descriptive keys, not arrays:

```typescript
// Good
return { sessions, isLoading, error, refetch }

// Bad - unclear what each position means
return [sessions, isLoading, error, refetch]
```

---

## Common Patterns

### Cleanup and Cancellation

Always clean up side effects:

```typescript
useEffect(() => {
    let isCancelled = false

    async function run() {
        const result = await fetchData()
        if (isCancelled) return  // Don't update state if unmounted
        setData(result)
    }

    run()

    return () => { isCancelled = true }
}, [])
```

### Stable Event Listeners

Use refs for stable event listeners:

```typescript
useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleScroll = () => {
        // Read from refs, not closure
        const isNearBottom = /* ... */
        if (isNearBottom !== atBottomRef.current) {
            atBottomRef.current = isNearBottom
            onAtBottomChangeRef.current(isNearBottom)
        }
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', handleScroll)
}, [])  // Stable: no dependencies, reads from refs
```

### Conditional Queries

Use `enabled` to prevent queries when dependencies are missing:

```typescript
const query = useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: async () => api.getSession(sessionId),
    enabled: Boolean(api) && Boolean(sessionId),  // Only run when both exist
})
```

---

## Common Mistakes

- ❌ Forgetting `use` prefix on hook names
- ❌ Putting business logic directly in components instead of hooks
- ❌ Not using `useCallback` for returned functions
- ❌ Stale closures (reading old state/props in callbacks) - use refs
- ❌ Not cleaning up side effects (event listeners, timers, async operations)
- ❌ Hardcoding query keys instead of using centralized `queryKeys`
- ❌ Not handling `api: null` case in query/mutation hooks
- ❌ Using `any` type in hook return values
- ❌ Returning arrays instead of objects for complex return values
- ❌ Not providing default values for optional data (e.g., `?? []`)
- ❌ Forgetting `enabled` option when query depends on other state
