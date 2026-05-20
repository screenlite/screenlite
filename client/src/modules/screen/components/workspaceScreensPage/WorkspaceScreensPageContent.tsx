import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { Pagination } from '@shared/ui/Pagination'
import { useQuery } from '@tanstack/react-query'
import { useDeferredLoading } from '@shared/hooks/useDeferredLoading'
import { useRouterScreenFilter } from '@modules/screen/hooks/useRouterScreenFilter'
import { workspaceScreensQuery } from '@modules/screen/api/queries/workspaceScreensQuery'
import { WorkspaceScreensPageList } from './WorkspaceScreensPageList'

export const WorkspaceScreensPageContent = () => {
    const workspace = useWorkspace()
    const { filters, setPage } = useRouterScreenFilter()

    const { data, isLoading } = useQuery(workspaceScreensQuery({
        workspaceId: workspace.id,
        filters
    }))

    const deferredIsLoading = useDeferredLoading(isLoading, { delay: 0, minDuration: 500 })

    return (
        <div
            className="flex flex-col h-full"
            style={ { height: 'calc(100vh - 168px)' } }
        >
            <div className="grow">
                <WorkspaceScreensPageList
                    data={ data }
                    isLoading={ deferredIsLoading }
                />
            </div>
            <Pagination
                page={ filters.page }
                pages={ data?.meta?.totalPages ?? 1 }
                onPageChange={ setPage }
            />
        </div>
    )
}
