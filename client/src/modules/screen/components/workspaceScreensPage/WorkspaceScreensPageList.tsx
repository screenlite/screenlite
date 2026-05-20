import { WorkspaceScreensResponse } from '@modules/screen/api/requests/workspaceScreensRequest'
import { useRouterScreenFilter } from '@modules/screen/hooks/useRouterScreenFilter'
import { WorkspaceScreensScreenCard } from '@modules/screen/components/WorkspaceScreensScreenCard'
import { Screen } from '@modules/screen/types'

export const WorkspaceScreensPageList = ({ data, isLoading }: { data?: WorkspaceScreensResponse, isLoading: boolean }) => {
    const { filters } = useRouterScreenFilter()

    if (isLoading || !data) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    const { meta, items: screens } = data
    const pageExists = filters.page <= meta.totalPages

    if (!pageExists) {
        return (
            <div>
                Page not found
            </div>
        )
    }

    if (screens.length === 0) {
        return (
            <div>
                No screens found
            </div>
        )
    }

    return (
        <div className='px-3.5 flex flex-col gap-2'>
            { screens.map(screen => (
                <WorkspaceScreensScreenCard key={ screen.id } screen={ screen as Screen } />
            )) }
        </div>
    )
}
