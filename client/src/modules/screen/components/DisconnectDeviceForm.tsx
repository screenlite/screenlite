import { useForm, SubmitHandler } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InputError } from '@shared/ui/input/InputError'
import { Button } from '@shared/ui/buttons/Button'
import { DialogDescription } from '@radix-ui/react-dialog'
import { DisconnectDeviceRequestData } from '../types'
import { useScreen } from '../hooks/useScreen'
import { disconnectDeviceRequest } from '../api/requests/disconnectDeviceRequest'
import { screenQuery } from '../api/queries/screenQuery'
import { ModalClose } from '@shared/ui/modal/Modal'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { handleAxiosFieldErrors } from '@shared/helpers/handleAxiosFieldErrors'

type Props = {
    onClose: () => void
}

export const DisconnectDeviceForm = ({ onClose }: Props) => {
    const screen = useScreen()
    const workspace = useWorkspace()

    const currentScreenQuery = screenQuery({
        screenId: screen.id,
        workspaceId: workspace.id
    })

    const queryClient = useQueryClient()

    const {
        handleSubmit,
        setError,
        formState: { errors }
    } = useForm<DisconnectDeviceRequestData>({
        defaultValues: {
            screenId: screen.id
        }
    })

    const { mutate, isPending } = useMutation({
        mutationFn: (data: DisconnectDeviceRequestData) => disconnectDeviceRequest(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: currentScreenQuery.queryKey })
            onClose()
        },
        onError: (error) => {
            handleAxiosFieldErrors(error, setError)
        }
    })

    const onSubmit: SubmitHandler<DisconnectDeviceRequestData> = (data) => {
        mutate(data)
    }

    return (
        <>
            <div className='flex flex-col items-start gap-4'>
                <DialogDescription asChild>
                    <div className='flex flex-col gap-3 text-sm'>
                        <p>You can reconnect this device again using the connection code below.</p>
                        <p>{ screen.device?.connectionCode }</p>
                        <p>After disconnection, the device connection code will also be displayed on the screen of your device again.</p>
                    </div>
                </DialogDescription>
                <form
                    onSubmit={ handleSubmit(onSubmit) }
                    className='w-full flex flex-col gap-2'
                >
                    <InputError error={ errors.screenId?.message }/>
                </form>
            </div>
            <div>
                <ModalClose asChild>
                    <Button
                        size='small'
                        className='w-full'
                    >
                        Cancel
                    </Button>
                </ModalClose>
                <Button
                    size='small'
                    className='w-full'
                    disabled={ isPending }
                    onClick={ () => handleSubmit(onSubmit)() }
                >
                    Disconnect
                </Button>
            </div>
        </>
    )
}
