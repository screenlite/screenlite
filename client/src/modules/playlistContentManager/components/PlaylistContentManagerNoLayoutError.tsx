import { ChangePlaylistLayoutButton } from '@modules/playlist/components/buttons/ChangePlaylistLayoutButton'
import { Button } from '@shared/ui/buttons/Button'

export const PlaylistContentManagerNoLayoutError = () => {
    return (
        <div className="grow flex flex-col items-center justify-center gap-4">
            <div className="text-neutral-500 text-sm">
                This playlist has no layout assigned. Please select a layout to start adding content.
            </div>
            <ChangePlaylistLayoutButton>
                <Button>
                    Choose layout
                </Button>
            </ChangePlaylistLayoutButton>
        </div>
    )
}
