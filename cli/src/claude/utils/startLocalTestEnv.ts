import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface StartupConfig {
    anthropicApiKey: string;
    anthropicBaseUrl: string;
}

interface ClaudeSettingsEnv {
    ANTHROPIC_API_KEY?: unknown;
    ANTHROPIC_BASE_URL?: unknown;
}

interface ClaudeSettingsFile {
    env?: ClaudeSettingsEnv;
}

const COMPOSE_PROJECT_NAME = 'zhushen';

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function resolveRequiredConfigValue(
    envValue: unknown,
    settingsValue: unknown,
    key: 'ANTHROPIC_API_KEY' | 'ANTHROPIC_BASE_URL',
    settingsPath: string
): string {
    if (isNonEmptyString(envValue)) {
        return envValue.trim();
    }

    if (isNonEmptyString(settingsValue)) {
        return settingsValue.trim();
    }

    throw new Error(`缺少 Claude 启动配置: ${key}。请先设置环境变量，或在 ${settingsPath} 的 .env 中提供对应字段。`);
}

export function getRepoRoot(): string {
    return dirname(dirname(dirname(dirname(import.meta.dir))));
}

export function getComposeFilePath(): string {
    return join(getRepoRoot(), 'docker-compose.yml');
}

export function getClaudeSettingsPath(): string {
    return join(homedir(), '.claude', 'settings.json');
}

export function readClaudeSettingsEnv(settingsPath: string = getClaudeSettingsPath()): ClaudeSettingsEnv {
    if (!existsSync(settingsPath)) {
        return {};
    }

    try {
        const parsed = JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettingsFile;
        if (!parsed || typeof parsed !== 'object' || !parsed.env || typeof parsed.env !== 'object') {
            return {};
        }

        return parsed.env;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`无法读取 Claude settings.json: ${settingsPath} (${message})`);
    }
}

export function resolveStartupConfig(env: NodeJS.ProcessEnv = process.env, settingsPath?: string): StartupConfig {
    const resolvedSettingsPath = settingsPath ?? getClaudeSettingsPath();
    const settingsEnv = readClaudeSettingsEnv(settingsPath);

    return {
        anthropicApiKey: resolveRequiredConfigValue(
            env.ANTHROPIC_API_KEY,
            settingsEnv.ANTHROPIC_API_KEY,
            'ANTHROPIC_API_KEY',
            resolvedSettingsPath
        ),
        anthropicBaseUrl: resolveRequiredConfigValue(
            env.ANTHROPIC_BASE_URL,
            settingsEnv.ANTHROPIC_BASE_URL,
            'ANTHROPIC_BASE_URL',
            resolvedSettingsPath
        )
    };
}

export function buildDockerComposeArgs(composeFilePath: string = getComposeFilePath()): string[] {
    return [
        'compose',
        '--project-name',
        COMPOSE_PROJECT_NAME,
        '-f',
        composeFilePath,
        'up',
        '-d',
        '--build'
    ];
}

export async function startLocalTestEnv(env: NodeJS.ProcessEnv = process.env): Promise<void> {
    const composeFilePath = getComposeFilePath();
    if (!existsSync(composeFilePath)) {
        throw new Error(`未找到 compose 文件: ${composeFilePath}`);
    }

    const startupConfig = resolveStartupConfig(env);
    const args = buildDockerComposeArgs(composeFilePath);

    await new Promise<void>((resolve, reject) => {
        const child = spawn('docker', args, {
            stdio: 'inherit',
            env: {
                ...env,
                ANTHROPIC_API_KEY: startupConfig.anthropicApiKey,
                ANTHROPIC_BASE_URL: startupConfig.anthropicBaseUrl
            }
        });

        child.on('error', (error) => {
            reject(new Error(`启动 docker compose 失败: ${error.message}`));
        });

        child.on('exit', (code, signal) => {
            if (signal) {
                reject(new Error(`docker compose 被信号中断: ${signal}`));
                return;
            }

            if (code !== 0) {
                reject(new Error(`docker compose 退出码异常: ${code ?? 'unknown'}`));
                return;
            }

            resolve();
        });
    });
}
