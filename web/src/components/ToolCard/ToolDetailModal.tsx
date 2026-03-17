import type { ToolCallBlock } from '@/chat/types'
import type { SessionMetadataSummary } from '@/types/api'
import { useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { CodeBlock } from '@/components/CodeBlock'
import { safeStringify } from '@zs/protocol'
import { getToolPresentation } from '@/components/ToolCard/knownTools'
import { getToolResultViewComponent } from '@/components/ToolCard/views/_results'

type ToolDetailModalProps = {
    block: ToolCallBlock | null
    open: boolean
    onOpenChange: (open: boolean) => void
    siblings?: ToolCallBlock[]
    currentIndex?: number
    onNavigate?: (index: number) => void
    metadata?: SessionMetadataSummary | null
}

function TaskStateIcon(props: { state: ToolCallBlock['tool']['state'] }) {
    if (props.state === 'completed') {
        return <span className="text-emerald-600">✓</span>
    }
    if (props.state === 'error') {
        return <span className="text-red-600">✕</span>
    }
    if (props.state === 'pending') {
        return <span className="text-amber-600">🔐</span>
    }
    return <span className="text-amber-600 animate-pulse">●</span>
}

export function ToolDetailModal(props: ToolDetailModalProps) {
    const { block, open, onOpenChange, siblings, currentIndex, onNavigate, metadata = null } = props

    const hasPrev = siblings && currentIndex !== undefined && currentIndex > 0
    const hasNext = siblings && currentIndex !== undefined && currentIndex < siblings.length - 1

    const handlePrev = useCallback(() => {
        if (hasPrev && onNavigate && currentIndex !== undefined) {
            onNavigate(currentIndex - 1)
        }
    }, [hasPrev, onNavigate, currentIndex])

    const handleNext = useCallback(() => {
        if (hasNext && onNavigate && currentIndex !== undefined) {
            onNavigate(currentIndex + 1)
        }
    }, [hasNext, onNavigate, currentIndex])

    // 键盘快捷键
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && hasPrev) {
                e.preventDefault()
                handlePrev()
            }
            if (e.key === 'ArrowRight' && hasNext) {
                e.preventDefault()
                handleNext()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, hasPrev, hasNext, handlePrev, handleNext])

    if (!block) return null

    const presentation = getToolPresentation({
        toolName: block.tool.name,
        input: block.tool.input,
        result: block.tool.result,
        childrenCount: block.children.length,
        description: block.tool.description,
        metadata
    })

    const elapsed = block.tool.completedAt && block.tool.startedAt
        ? ((block.tool.completedAt - block.tool.startedAt) / 1000).toFixed(1)
        : null

    const ResultView = getToolResultViewComponent(block.tool.name)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={!hasPrev}
                            className="shrink-0"
                        >
                            ← 上一个
                        </Button>
                        <DialogTitle className="flex-1 text-center">子任务详情</DialogTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={!hasNext}
                            className="shrink-0"
                        >
                            下一个 →
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* 任务名称 */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">任务名称</h3>
                        <p className="text-[var(--app-fg)]">{presentation.title}</p>
                        {presentation.subtitle && (
                            <p className="text-sm text-[var(--app-hint)] mt-1">{presentation.subtitle}</p>
                        )}
                    </div>

                    {/* 状态 */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">状态</h3>
                        <div className="flex items-center gap-2">
                            <TaskStateIcon state={block.tool.state} />
                            <span className="text-[var(--app-fg)]">
                                {block.tool.state === 'completed' ? '完成' :
                                 block.tool.state === 'error' ? '错误' :
                                 block.tool.state === 'pending' ? '等待批准' : '运行中'}
                            </span>
                            {elapsed && (
                                <span className="text-sm text-[var(--app-hint)]">({elapsed}s)</span>
                            )}
                        </div>
                    </div>

                    {/* 描述 */}
                    {block.tool.description && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">描述</h3>
                            <p className="text-[var(--app-fg)]">{block.tool.description}</p>
                        </div>
                    )}

                    {/* 输入参数 */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">输入参数</h3>
                        <CodeBlock
                            code={safeStringify(block.tool.input)}
                            language="json"
                        />
                    </div>

                    {/* 输出结果 */}
                    {block.tool.result !== undefined && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">输出结果</h3>
                            <ResultView block={block} metadata={metadata} />
                        </div>
                    )}

                    {/* 子任务数量 */}
                    {block.children.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--app-hint)] mb-1">子任务</h3>
                            <p className="text-[var(--app-fg)]">{block.children.length} 个子任务</p>
                        </div>
                    )}
                </div>

                <div className="text-xs text-[var(--app-hint)] text-center pt-2 border-t">
                    提示：使用 ← → 键快速切换，ESC 键关闭
                </div>
            </DialogContent>
        </Dialog>
    )
}
