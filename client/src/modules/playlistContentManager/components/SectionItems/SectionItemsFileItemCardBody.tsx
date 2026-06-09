import { FileThumbnail } from '@modules/file/components/FileThumbnail'
import { PlaylistContentManagerItem } from '@modules/playlist/types'
import { usePlaylistContentManagerStorage } from '@stores/usePlaylistContentManagerStorage'

export const SectionItemsFileItemCardBody = ({ item }: { item: PlaylistContentManagerItem }) => {
    const { file } = item
    const removeItems = usePlaylistContentManagerStorage(s => s.removeItems)

    if(!file) {
        return <div>File not found</div>
    }

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="w-14 h-14 flex-shrink-0">
                <FileThumbnail file={ file } />
            </div>
            <div className="flex-1 text-sm truncate">{ file.name }</div>
            <button
                onClick={ (e) => { e.stopPropagation(); removeItems(item.id) } }
                onPointerDown={ (e) => e.stopPropagation() }
                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 flex-shrink-0"
                title="Remove"
            >
                ✕
            </button>
        </div>
    )
}
