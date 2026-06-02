import axios from '@config/axios'
import { DeletePlaylistScheduleRequestData } from '../../types'

export const deletePlaylistScheduleRequest = async (data: DeletePlaylistScheduleRequestData & { workspaceId: string }) => {
    await axios.post(`/workspaces/${data.workspaceId}/playlist-schedules/delete`, data)
}
