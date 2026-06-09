import { QueryErrorResetBoundary, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useSetPlaylistQueryData } from '@modules/playlist/hooks/useSetPlaylistQueryData'
import { Button } from '@shared/ui/buttons/Button'
import { ModalClose } from '@shared/ui/modal/Modal'
import { usePlaylist } from '@modules/playlist/hooks/usePlaylist'
import { Suspense, useState } from 'react'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { ErrorBoundary } from 'react-error-boundary'
import { useDebounce } from '@uidotdev/usehooks'
import { Input } from '@shared/ui/input/Input'
import { changePlaylistLayoutRequest, ChangePlaylistLayoutRequestData } from '@modules/playlist/api/requests/changePlaylistLayoutRequest'
import { workspacePlaylistLayoutsQuery } from '@modules/playlistLayout/api/workspacePlaylistLayoutsRequest'

const PlaylistLayoutsList = ({ search, selectedLayoutId, selectLayout }: { search: string, selectedLayoutId: string | undefined, selectLayout: (id: string) => void }) => {
    const workspace = useWorkspace()
    const { data } = useSuspenseQuery(workspacePlaylistLayoutsQuery({
        workspaceId: workspace.id,
        filters: {
            search,
            limit: 10,
            page: 1
        }
    }))
    const { items: playlistLayouts } = data

    return (
        <>
            {
                playlistLayouts.map(
                    playlistLayout => (
                        <div
                            key={ playlistLayout.id }
                            onClick={ () => selectLayout(playlistLayout.id) }
                        >
                            <div className='block p-3 hover:bg-neutral-50'>
                                { playlistLayout.name }
                                { selectedLayoutId === playlistLayout.id && (
                                    <div>
                                        selected
                                    </div>
                                ) }
                            </div>
                        </div>
                    )
                )
            }
        </>
    )
}

export const ChangePlaylistLayoutModal = ({ closeModal }: { closeModal: () => void }) => {
    const playlist = usePlaylist()
    const setPlaylistQueryData = useSetPlaylistQueryData()
    const [playlistLayoutId, setPlaylistLayoutId] = useState(playlist.layout?.id)
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const { mutate, isPending } = useMutation({
        mutationFn: (data: ChangePlaylistLayoutRequestData) => changePlaylistLayoutRequest(data),
        onSuccess: async (playlist) => {
            setPlaylistQueryData(playlist.id, playlist)
            closeModal()
        },
        onError: (error) => {
            console.log(error)
        }
    })

    const submit = () => {
        if(!playlistLayoutId) {
            alert('Please select a layout')
            return
        }

        mutate({
            playlistId: playlist.id,
            playlistLayoutId,
            workspaceId: playlist.workspaceId
        })
    }
	  
    return (
        <div className='flex flex-col gap-5 mt-5 px-7'>
            <div className='flex flex-col gap-4'>
                <div className='mb-4'>
                    <Input
                        value={ searchTerm }
                        onChange={ (e) => setSearchTerm(e.target.value) }
                        placeholder="Search layouts..."
                    />
                </div>
                <div>
                    <QueryErrorResetBoundary>
                        <ErrorBoundary fallbackRender={ ({ error }) => (
                            <div>
                                Error: { error?.message || 'Unknown error' }
                            </div>
                        ) }
                        >
                            <Suspense fallback={ <>Loading</> }>
                                <PlaylistLayoutsList
                                    search={ debouncedSearchTerm }
                                    selectedLayoutId={ playlistLayoutId }
                                    selectLayout={ (id: string) => setPlaylistLayoutId(id) }
                                />
                            </Suspense>
                        </ErrorBoundary>
                    </QueryErrorResetBoundary>
                </div>
            </div>
            <div className='flex gap-4 justify-end'>
                <ModalClose asChild>
                    <Button
                        color='secondary'
                        variant='soft'
                    >
                        Cancel
                    </Button>
                </ModalClose>
                <Button
                    disabled={ isPending || !playlistLayoutId }
                    onClick={ submit }
                >
                    Save
                </Button>
            </div>
        </div>
    )
}
