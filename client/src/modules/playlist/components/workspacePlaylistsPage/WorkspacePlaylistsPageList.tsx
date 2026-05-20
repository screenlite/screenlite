import { WorkspacePlaylistsPlaylistCard } from '../WorkspacePlaylistsPlaylistCard'
import { WorkspacePlaylistsRequestResponse } from '@modules/playlist/api/requests/workspacePlaylistsRequest'
import { useRouterPlaylistFilter } from '@modules/playlist/hooks/useRouterPlaylistFilter'

export const WorkspacePlaylistsPageList = ({ data, isLoading }: { data?: WorkspacePlaylistsRequestResponse, isLoading: boolean }) => {
    const { filters } = useRouterPlaylistFilter()

    if (isLoading || !data) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    const { meta, items: playlists } = data

    const pageExists = filters.page <= meta.totalPages

    if(!pageExists) {
        return (
            <div>
                Page not found
            </div>
        )
    }

    if(playlists.length === 0) {
        return (
            <div>
                No playlists found
            </div>
        )
    }

    return (
        <div>
            <div className='flex flex-col gap-2'>
                {
                    playlists.map(
                        playlist => (
                            <WorkspacePlaylistsPlaylistCard
                                key={ playlist.id }
                                playlist={ playlist }
                            />
                        )
                    )
                }
            </div>
        </div>
    )
}