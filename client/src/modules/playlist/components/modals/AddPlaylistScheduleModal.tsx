import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button } from '@shared/ui/buttons/Button'
import { DialogDescription } from '@radix-ui/react-dialog'
import { CreatePlaylistScheduleRequestData } from '../../types'
import { playlistQuery } from '../../api/queries/playlistQuery'
import { createPlaylistScheduleRequest } from '../../api/requests/createPlaylistScheduleRequest'
import { usePlaylist } from '../../hooks/usePlaylist'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { InputLabelGroup } from '@shared/ui/input/InputLabelGroup'
import { InputError } from '@shared/ui/input/InputError'
import { ModalClose } from '@shared/ui/modal/Modal'
import { Input } from '@shared/ui/input/Input'

type Props = {
    onClose: () => void
}

export const AddPlaylistScheduleModal = ({ onClose }: Props) => {
    const playlist = usePlaylist()
    const workspace = useWorkspace()
    const queryClient = useQueryClient()
    const currentPlaylistQuery = playlistQuery({
        playlistId: playlist.id,
        workspaceId: workspace.id
    })

    const today = new Date().toISOString().substring(0, 10)

    const { control, handleSubmit, setError, formState: { errors } } = useForm<CreatePlaylistScheduleRequestData>({
        defaultValues: {
            endAt: '',
            endTime: '23:59',
            playlistId: playlist.id,
            startAt: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
            startTime: '00:00',
            weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        }
    })

    const { mutate, isPending } = useMutation({
        mutationFn: (data: CreatePlaylistScheduleRequestData) =>
            createPlaylistScheduleRequest({ ...data, workspaceId: workspace.id }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: currentPlaylistQuery.queryKey })
            onClose()
        },
        onError: (error) => {
            if (isAxiosError(error) && error.response?.data?.errors) {
                const errs = error.response.data.errors
                for (const [field, message] of Object.entries(errs)) {
                    setError(field as keyof CreatePlaylistScheduleRequestData, {
                        type: 'custom',
                        message: String(message)
                    })
                }
            }
        }
    })

    const onSubmit: SubmitHandler<CreatePlaylistScheduleRequestData> = (data) => {
        mutate({
            ...data,
            startAt: data.startAt,
            endAt: data.endAt || null,
            startTime: data.startTime || null,
            endTime: data.endTime || null
        })
    }

    return (
        <>
            <div className="flex flex-col items-start gap-4">
                <DialogDescription aria-description="Create playlist schedule modal"/>
                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-2">
                    <InputLabelGroup label="Start date" name="startAt">
                        <Controller
                            name="startAt"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="date"
                                    value={field.value ? field.value.substring(0, 10) : today}
                                    onChange={e => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                />
                            )}
                        />
                        <InputError error={errors.startAt?.message}/>
                    </InputLabelGroup>
                    <InputLabelGroup label="End date (optional)" name="endAt">
                        <Controller
                            name="endAt"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="date"
                                    value={field.value ? field.value.substring(0, 10) : ''}
                                    onChange={e => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                />
                            )}
                        />
                        <InputError error={errors.endAt?.message}/>
                    </InputLabelGroup>
                    <InputLabelGroup label="Start time" name="startTime">
                        <Controller
                            name="startTime"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} type="time" value={field.value ?? ''} />
                            )}
                        />
                        <InputError error={errors.startTime?.message}/>
                    </InputLabelGroup>
                    <InputLabelGroup label="End time" name="endTime">
                        <Controller
                            name="endTime"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} type="time" value={field.value ?? ''} />
                            )}
                        />
                        <InputError error={errors.endTime?.message}/>
                    </InputLabelGroup>
                </form>
            </div>
            <div className="flex flex-col gap-2 mt-4">
                <Button size="small" className="w-full" disabled={isPending} onClick={() => handleSubmit(onSubmit)()}>
                    Create schedule
                </Button>
                <ModalClose asChild>
                    <Button size="small" variant="soft" className="w-full">
                        Cancel
                    </Button>
                </ModalClose>
            </div>
        </>
    )
}
