import axios from '@config/axios'
import { CreatePlaylistScheduleRequestData, PlaylistSchedule } from '../../types'

type CreatePlaylistScheduleResponse = {
    schedule: PlaylistSchedule
}

export const createPlaylistScheduleRequest = async (data: CreatePlaylistScheduleRequestData & { workspaceId: string }) => {
    const response = await axios.post<CreatePlaylistScheduleResponse>(
        `/workspaces/${data.workspaceId}/playlist-schedules/create`,
        data
    )
    return response.data.schedule
}
