import { workspacePlaylistsQuery } from '@modules/playlist/api/queries/workspacePlaylistsQuery'
import { useRouterPlaylistFilter } from '@modules/playlist/hooks/useRouterPlaylistFilter'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { Pagination } from '@shared/ui/Pagination'
import { useQuery } from '@tanstack/react-query'
import { WorkspacePlaylistsPageList } from './WorkspacePlaylistsPageList'
import { useDeferredLoading } from '@shared/hooks/useDeferredLoading'

export const WorkspacePlaylistsPageContent = () => {
    const workspace = useWorkspace()
    
    const { filters, setFilter } = useRouterPlaylistFilter()
    
    const { data, isLoading } = useQuery(workspacePlaylistsQuery({
        workspaceId: workspace.id,
        filters
    }))

    const deferredIsLoading = useDeferredLoading(isLoading, { delay: 0, minDuration: 500 })

    return (
        <>
            <WorkspacePlaylistsPageList
                data={ data }
                isLoading={ deferredIsLoading }
            />
            <Pagination
                page={ filters.page }
                pages={ data?.meta.totalPages }
                onPageChange={ (value) => setFilter('page', value.toString()) }
            />
        </>
        
    )
}