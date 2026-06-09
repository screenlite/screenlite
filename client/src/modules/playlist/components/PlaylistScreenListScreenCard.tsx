import { Screen } from '@modules/screen/types'
import { useWorkspaceRoutes } from '@/modules/workspace/hooks/useWorkspaceRoutes'
import { Link } from 'react-router'
import { removeScreensFromPlaylistRequest } from '../api/requests/removeScreensFromPlaylistRequest'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RemoveScreensFromPlaylistRequestData } from '../types'
import { usePlaylist } from '../hooks/usePlaylist'
import { Button } from '@/shared/ui/buttons/Button'
import { playlistScreensQuery } from '../api/queries/playlistScreensQuery'

export const PlaylistScreenListScreenCard = ({ screen }: { screen: Screen }) => {
    const playlist = usePlaylist()
    const routes = useWorkspaceRoutes()
    const screensQuery = playlistScreensQuery(playlist.id)
    const queryClient = useQueryClient()

    const { mutate: removeScreenMutation, isPending } = useMutation({
        mutationFn: (data: RemoveScreensFromPlaylistRequestData) => removeScreensFromPlaylistRequest(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: screensQuery.queryKey })
        },
        onError: (error) => {
            console.log(error)
        }
    })

    const handleRemove = () => {
        removeScreenMutation({
            playlistId: playlist.id,
            screenIds: [screen.id]
        })
    }

    return (
        <div>
            <h3>{ screen.name }</h3>
            <Link to={ routes.screen(screen.id) }>
                Details
            </Link>
            <Button
                onClick={ handleRemove }
                disabled={ isPending }
            >
                Remove from Playlist
            </Button>
        </div>
    )
}
