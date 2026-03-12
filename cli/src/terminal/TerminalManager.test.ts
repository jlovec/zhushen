import { describe, expect, it, mock } from 'bun:test'

const warnMock = mock(() => {})
const debugMock = mock(() => {})

mock.module('@/ui/logger', () => ({
    logger: {
        warn: warnMock,
        debug: debugMock
    }
}))

describe('TerminalManager', () => {
    it('returns explicit unsupported error on Windows before spawning terminal', async () => {
        const originalPlatform = process.platform
        const onError = mock(() => {})
        const onReady = mock(() => {})
        const onOutput = mock(() => {})
        const onExit = mock(() => {})

        Object.defineProperty(process, 'platform', {
            value: 'win32',
            configurable: true
        })

        const { TerminalManager } = await import('./TerminalManager')

        const manager = new TerminalManager({
            sessionId: 'session-1',
            getSessionPath: () => '/tmp/project',
            onReady,
            onOutput,
            onExit,
            onError
        })

        manager.create('terminal-1', 80, 24)

        expect(onReady).not.toHaveBeenCalled()
        expect(onOutput).not.toHaveBeenCalled()
        expect(onExit).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]?.[0]).toEqual({
            sessionId: 'session-1',
            terminalId: 'terminal-1',
            message: 'Interactive terminal is not supported on Windows runners yet. Current implementation depends on Bun terminal support, which is unavailable on this platform.'
        })
        expect(warnMock).toHaveBeenCalledTimes(1)

        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            configurable: true
        })
    })
})
