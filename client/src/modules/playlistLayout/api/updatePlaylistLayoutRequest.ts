import axios from '@config/axios'
import { PlaylistLayout } from '../types'
import { PlaylistLayoutEditorLayoutSection } from '@modules/playlistLayoutEditor/types'
type UpdatePlaylistLayoutRequestResponse = {
    playlistLayout: PlaylistLayout
}
export type UpdatePlaylistLayoutRequestData = {
    playlistLayoutId: string
    workspaceId: string
    name?: string
    resolutionWidth?: number
    resolutionHeight?: number
    sections?: PlaylistLayoutEditorLayoutSection[]
}
export const updatePlaylistLayoutRequest = async (data: UpdatePlaylistLayoutRequestData) => {
    const { playlistLayoutId, workspaceId, ...body } = data
    const response = await axios.patch<UpdatePlaylistLayoutRequestResponse>(
        `/workspaces/${workspaceId}/playlistLayouts/${playlistLayoutId}`,
        body
    )
    return response.data.playlistLayout
}
