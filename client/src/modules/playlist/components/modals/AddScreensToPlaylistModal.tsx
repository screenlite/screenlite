import { Button } from '@shared/ui/buttons/Button'
import { usePlaylist } from '../../hooks/usePlaylist'
import { QueryErrorResetBoundary, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { workspaceScreensQuery } from '@modules/screen/api/queries/workspaceScreensQuery'
import { ErrorBoundary } from 'react-error-boundary'
import { Suspense, useEffect, useState } from 'react'
import { ScreenWithPlaylists } from '@modules/screen/api/requests/workspaceScreensRequest'
import { useSelection } from '@shared/hooks/useSelection'
import { AddScreensToPlaylistRequestData } from '../../types'
import { SubmitHandler, useForm } from 'react-hook-form'
import { addScreensToPlaylistRequest } from '../../api/requests/addScreensToPlaylistRequest'
import { playlistScreensQuery } from '../../api/queries/playlistScreensQuery'
import { useDebounce } from '@uidotdev/usehooks'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { ModalClose } from '@shared/ui/modal/Modal'
import { Input } from '@shared/ui/input/Input'
import { playlistQuery } from '@modules/playlist/api/queries/playlistQuery'
import { handleAxiosFieldErrors } from '@shared/helpers/handleAxiosFieldErrors'

interface ScreenListProps {
    search: string
    toggleItemSelection: (screen: ScreenWithPlaylists) => void
    isSelected: (screen: ScreenWithPlaylists) => boolean
}

const ScreenList = ({ search, toggleItemSelection, isSelected }: ScreenListProps) => {
    const playlist = usePlaylist()
    const workspace = useWorkspace()

    const { data } = useSuspenseQuery(workspaceScreensQuery(
        {
            workspaceId: workspace.id,
            filters: {
                search,
                playlistId: playlist.id,
                page: 1,
                limit: 10
            }
        }
    ))

    const screens = data.items as ScreenWithPlaylists[]

    const meta = data.meta

    const isAddedToPlaylist = (screen: ScreenWithPlaylists) => {
        return (screen.playlists?.length ?? 0) > 0
    }

    return (
        <ul className='w-full'>
            { meta.total === 0 && <li>No screens found</li> }
            { screens.map(screen => (
                <li
                    key={ screen.id }
                    onClick={ () => {
                        if (!isAddedToPlaylist(screen)) {
                            toggleItemSelection(screen)
                        }
                    } }
                    className='px-4 py-2 cursor-pointer hover:bg-neutral-100'
                >
                    { screen.name }
                    { isAddedToPlaylist(screen) && <span>Screen is added</span> }
                    {
                        isSelected(screen) && <span>Selected</span>
                    }
                </li>
            )) }
        </ul>
    )
}

export const AddScreensToPlaylistModal = ({ onClose }: { onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const playlist = usePlaylist()
    const screensQuery = playlistScreensQuery(playlist.id)
    const queryClient = useQueryClient()
    const workspace = useWorkspace()

    const { toggleItemSelection, isSelected, selectedItems } = useSelection<ScreenWithPlaylists>([], 'id')

    const {
        handleSubmit,
        setError,
        setValue,
    } = useForm<AddScreensToPlaylistRequestData>({
        defaultValues: {
            playlistId: playlist.id,
            screenIds: selectedItems.map(item => item.id)
        }
    })

    useEffect(() => {
        setValue('screenIds', selectedItems.map(item => item.id))
    }, [selectedItems, setValue])

    const { mutate, isPending } = useMutation({
        mutationFn: (data: AddScreensToPlaylistRequestData) => addScreensToPlaylistRequest(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: playlistQuery({
                playlistId: playlist.id,
                workspaceId: workspace.id
            }).queryKey })
            await queryClient.invalidateQueries({ queryKey: screensQuery.queryKey })
            onClose()
        },
        onError: (error) => {
            handleAxiosFieldErrors(error, setError)
        }
    })

    const onSubmit: SubmitHandler<AddScreensToPlaylistRequestData> = (data) => {
        mutate(data)
    }

    return (
        <>
            <div className='flex flex-col items-start'>
                <div className='mb-4'>
                    <Input
                        value={ searchTerm }
                        onChange={ (e) => setSearchTerm(e.target.value) }
                        placeholder="Search screens..."
                    />
                </div>
                <QueryErrorResetBoundary>
                    <ErrorBoundary fallbackRender={ () => (
                        <div>
                            There was an error!
                        </div>
                    ) }
                    >
                        <Suspense fallback={ <>Loading</> }>
                            <ScreenList
                                search={ debouncedSearchTerm }
                                toggleItemSelection={ toggleItemSelection }
                                isSelected={ isSelected }
                            />
                        </Suspense>
                    </ErrorBoundary>
                </QueryErrorResetBoundary>
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
                    disabled={ isPending || selectedItems.length === 0 }
                    onClick={ () => handleSubmit(onSubmit)() }
                >
                    Add screens
                </Button>
            </div>
        </>
    )
}
