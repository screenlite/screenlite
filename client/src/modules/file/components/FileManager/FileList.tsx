import { DraggableFileCard } from '../FileCard'
import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useCallback } from 'react'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { workspaceFilesQuery } from '../../api/workspaceFiles'
import { useSelectionStore } from '@stores/useSelectionStore'
import { WorkspaceFile } from '../../types'
import { useContextMenuStore } from '@stores/useContextMenuStore'

interface FileListProps {
    search: string
    folderId?: string
    onFileDoubleClick?: (file: WorkspaceFile) => void
}

const SuspenseFileList = ({ search, folderId, onFileDoubleClick }: FileListProps) => {
    const workspace = useWorkspace()
    const { data } = useSuspenseQuery(workspaceFilesQuery({
        id: workspace.id,
        filters: {
            search,
            folderId: folderId || null
        }
    }))

    const { items: files } = data
    const { isSelected, setSelectedItems, handleItemClick } = useSelectionStore()
    const { openContextMenu } = useContextMenuStore()

    const handleFileDoubleClick = useCallback((file: WorkspaceFile) => {
        onFileDoubleClick?.(file)
    }, [onFileDoubleClick])

    const handleFileContextMenu = useCallback((file: WorkspaceFile, event: React.MouseEvent) => {
        const isFileSelected = isSelected(file.id)
        
        if (!isFileSelected) {
            setSelectedItems({
                [file.id]: { item: file, entity: 'file' }
            })
        }
        
        openContextMenu('file', file, event.clientX, event.clientY)
    }, [openContextMenu, isSelected, setSelectedItems])

    return (
        <div className='flex flex-col gap-1'>
            {
                files.map(
                    (file: WorkspaceFile, idx: number) => (
                        <DraggableFileCard
                            file={ file }
                            key={ file.id }
                            onClick={ (e: React.MouseEvent) => handleItemClick(file, idx, e, files, 'file') }
                            onDoubleClick={ () => handleFileDoubleClick(file) }
                            onContextMenu={ (e: React.MouseEvent) => handleFileContextMenu(file, e) }
                        />
                    )
                )
            }
        </div>
    )
}

export const FileList = ({ folderId, onFileDoubleClick }: { folderId?: string, onFileDoubleClick?: (file: WorkspaceFile) => void }) => {
    return (
        <QueryErrorResetBoundary>
            <ErrorBoundary fallbackRender={ () => (
                <div>
                    There was an error!
                </div>
            ) }
            >
                <Suspense fallback={ <>Loading</> }>
                    <SuspenseFileList 
                        search={ '' } 
                        folderId={ folderId }
                        onFileDoubleClick={ onFileDoubleClick }
                    />
                </Suspense>
            </ErrorBoundary>
        </QueryErrorResetBoundary>
    )
}