import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import * as fsPromises from 'node:fs/promises'

const realSetTimeout = globalThis.setTimeout
const scheduledTimeouts = new Set<ReturnType<typeof setTimeout>>()

function trackTimeout(callback: (...args: any[]) => void, delay?: number, ...args: any[]) {
  const handle = realSetTimeout((...innerArgs: any[]) => {
    scheduledTimeouts.delete(handle)
    callback(...innerArgs)
  }, delay, ...args)
  scheduledTimeouts.add(handle)
  return handle
}

function clearScheduledTimeouts() {
  for (const handle of scheduledTimeouts) {
    clearTimeout(handle)
  }
  scheduledTimeouts.clear()
}

globalThis.setTimeout = trackTimeout as typeof setTimeout
if (typeof global !== 'undefined') {
  global.setTimeout = trackTimeout as typeof setTimeout
}

process.setMaxListeners(Math.max(process.getMaxListeners(), 50))
process.removeAllListeners('SIGINT')
process.removeAllListeners('SIGTERM')
process.removeAllListeners('uncaughtException')
process.removeAllListeners('unhandledRejection')
process.removeAllListeners('exit')
process.removeAllListeners('beforeExit')

const originalProcessExit = process.exit
process.exit = ((code?: string | number | null | undefined) => {
  throw new Error(`EXIT:${code ?? 0}`)
}) as typeof process.exit

const originalConsoleLog = console.log
console.log = mock(() => undefined) as typeof console.log

const originalConsoleError = console.error
console.error = mock(() => undefined) as typeof console.error

const originalProcessOn = process.on.bind(process)
const registeredProcessListeners = new Map<string, Set<(...args: any[]) => void>>()
process.on = ((event: string, listener: (...args: any[]) => void) => {
  const listeners = registeredProcessListeners.get(event) ?? new Set<(...args: any[]) => void>()
  listeners.add(listener)
  registeredProcessListeners.set(event, listeners)
  return originalProcessOn(event as any, listener as any)
}) as typeof process.on

function cleanupProcessListeners() {
  for (const [event, listeners] of registeredProcessListeners.entries()) {
    for (const listener of listeners) {
      process.off(event as any, listener as any)
    }
  }
  registeredProcessListeners.clear()
}

afterEach(() => {
  clearScheduledTimeouts()
  cleanupProcessListeners()
})

afterAll(() => {
  globalThis.setTimeout = realSetTimeout
  if (typeof global !== 'undefined') {
    global.setTimeout = realSetTimeout
  }
  process.exit = originalProcessExit
  console.log = originalConsoleLog
  console.error = originalConsoleError
  process.on = originalProcessOn as typeof process.on
})


const mockGetRunnerAvailability = mock()
const mockIsRunnerRunningCurrentlyInstalledZhushenVersion = mock()
const mockStopRunner = mock()
const mockWriteRunnerState = mock()
const mockReadRunnerState = mock()
const mockAcquireRunnerLock = mock()
const mockReleaseRunnerLock = mock(async () => undefined)
const mockClearRunnerState = mock(async () => undefined)
const mockClearRunnerLock = mock(async () => undefined)
const mockAccess = mock()
const mockMkdir = mock()
const mockMkdtemp = mock()
const mockWriteFile = mock()
const mockReaddir = mock(async () => [])
const mockReadFileFs = mock(async () => '')
const mockRm = mock(async () => undefined)

mock.module('@/api/api', () => ({ ApiClient: mock() }))
mock.module('@/ui/logger', () => ({
  logger: {
    debug: mock(),
    debugLargeJson: mock()
  },
  getLatestRunnerLog: mock(async () => null),
  listRunnerLogFiles: mock(async () => [])
}))
mock.module('@/ui/auth', () => ({ authAndSetupMachineIfNeeded: mock() }))
mock.module('@/ui/doctor', () => ({ getEnvironmentInfo: mock(() => ({})) }))
mock.module('@/utils/spawnZhushenCLI', () => ({
  spawnZhushenCLI: mock(),
  getZhushenCliCommand: mock(() => ({ command: 'zs', args: [] })),
  getSpawnedCliWorkingDirectory: mock(() => process.cwd())
}))
mock.module('@/persistence', () => ({
  writeRunnerState: mockWriteRunnerState,
  readRunnerState: mockReadRunnerState,
  acquireRunnerLock: mockAcquireRunnerLock,
  releaseRunnerLock: mockReleaseRunnerLock,
  clearRunnerState: mockClearRunnerState,
  clearRunnerLock: mockClearRunnerLock,
  readSettings: mock(async () => ({}))
}))
mock.module('@/utils/process', () => ({
  isProcessAlive: mock(),
  isWindows: mock(() => false),
  killProcess: mock(),
  killProcessByChildProcess: mock()
}))
mock.module('@/utils/time', () => ({
  delay: mock(),
  exponentialBackoffDelay: mock(() => 0),
  createBackoff: mock(() => mock(async <T>(callback: () => Promise<T>) => await callback())),
  backoff: mock(async <T>(callback: () => Promise<T>) => await callback()),
  withRetry: mock(async <T>(fn: () => Promise<T>) => await fn())
}))
mock.module('@/utils/errorUtils', () => ({
  apiValidationError: mock((message: string) => new Error(message)),
  extractErrorInfo: mock(() => ({
    message: 'boom',
    messageLower: 'boom',
    responseErrorText: '',
    serverProtocolVersion: undefined
  })),
  isRetryableConnectionError: mock(() => false)
}))
mock.module('./controlClient', () => ({
  notifyRunnerSessionStarted: mock(async () => ({ ok: true })),
  listRunnerSessions: mock(async () => []),
  stopRunnerSession: mock(async () => false),
  spawnRunnerSession: mock(async () => ({})),
  stopRunnerHttp: mock(async () => undefined),
  cleanupRunnerState: mock(),
  getInstalledCliMtimeMs: mock(),
  getRunnerAvailability: mockGetRunnerAvailability,
  checkIfRunnerRunningAndCleanupStaleState: mock(async () => false),
  isRunnerRunningCurrentlyInstalledZhushenVersion: mockIsRunnerRunningCurrentlyInstalledZhushenVersion,
  stopRunner: mockStopRunner
}))
mock.module('node:fs/promises', () => ({
  access: mockAccess,
  mkdir: mockMkdir,
  mkdtemp: mockMkdtemp,
  writeFile: mockWriteFile,
  readdir: mockReaddir,
  readFile: mockReadFileFs,
  rm: mockRm,
  default: {
    access: mockAccess,
    mkdir: mockMkdir,
    mkdtemp: mockMkdtemp,
    writeFile: mockWriteFile,
    readdir: mockReaddir,
    readFile: mockReadFileFs,
    rm: mockRm
  }
}))
mock.module('./controlServer', () => ({ startRunnerControlServer: mock() }))
mock.module('./worktree', () => ({ createWorktree: mock(), removeWorktree: mock() }))
mock.module('@/agent/sessionFactory', () => ({
  bootstrapSession: mock(),
  buildMachineMetadata: mock(),
  buildSessionMetadata: mock()
}))
mock.module('@/claude/utils/authConfig', () => ({
  checkClaudeAuthConfig: mock(() => ({ ok: true, source: { type: 'env', envKey: 'CLAUDE_CODE_OAUTH_TOKEN' }, checkedPaths: [] })),
  formatClaudeAuthConfigError: mock(() => 'missing auth details')
}))
mock.module('../../package.json', () => ({ default: { version: '1.0.0' } }))

describe('startRunner degraded handling', () => {
  beforeEach(() => {
    mockGetRunnerAvailability.mockReset()
    mockIsRunnerRunningCurrentlyInstalledZhushenVersion.mockReset()
    mockStopRunner.mockReset()
    mockWriteRunnerState.mockReset()
    mockReadRunnerState.mockReset()
    mockAcquireRunnerLock.mockReset()
    mockReleaseRunnerLock.mockReset()
    mockClearRunnerState.mockReset()
    mockClearRunnerLock.mockReset()
  })



  it('does not stop the existing runner when availability is degraded', async () => {
    mockGetRunnerAvailability.mockResolvedValue({
      status: 'degraded',
      state: {
        pid: 123,
        httpPort: 1,
        startedWithCliVersion: '1.0.0'
      }
    })
    mockIsRunnerRunningCurrentlyInstalledZhushenVersion.mockResolvedValue(false)

    const { startRunner } = await import('./run')

    await expect(startRunner()).rejects.toThrow('EXIT:0')
    expect(mockStopRunner).not.toHaveBeenCalled()
    expect(mockIsRunnerRunningCurrentlyInstalledZhushenVersion).not.toHaveBeenCalled()
  })
})
