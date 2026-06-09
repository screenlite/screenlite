import { PlaylistSchedule } from '../types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePlaylist } from '../hooks/usePlaylist'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { playlistQuery } from '../api/queries/playlistQuery'
import { deletePlaylistScheduleRequest } from '../api/requests/deletePlaylistScheduleRequest'

export const PlaylistScheduleListPlaylistScheduleCard = ({ schedule }: { schedule: PlaylistSchedule }) => {
    const playlist = usePlaylist()
    const workspace = useWorkspace()
    const queryClient = useQueryClient()
    const { startAt, startTime, endAt, endTime, weekdays } = schedule

    const { mutate: deleteSchedule, isPending } = useMutation({
        mutationFn: () => deletePlaylistScheduleRequest({ scheduleId: schedule.id, workspaceId: workspace.id }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: playlistQuery({ playlistId: playlist.id, workspaceId: workspace.id }).queryKey
            })
        }
    })

    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString() : ''
    const formatDays = (days: string[]) => days.length === 7 ? 'Every day' : days.map(d => d.substring(0, 3)).join(', ')

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-100 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">
                        {formatDate(startAt)} {endAt ? `— ${formatDate(endAt)}` : "(no end date)"}
                    </div>
                    <div className="text-sm text-gray-500">
                        {startTime} — {endTime}
                    </div>
                    <div className="text-xs text-gray-400">
                        {formatDays(weekdays)}
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        deleteSchedule()
                    }}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    {isPending ? "..." : "Delete"}
                </button>
            </div>
        </div>
    )
}
