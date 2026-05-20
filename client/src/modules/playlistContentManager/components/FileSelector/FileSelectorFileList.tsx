import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FileSelectorFileCard } from './FileSelectorFileCard'
import { workspaceFilesQuery } from '@modules/file/api/workspaceFiles'

type Props = {
    search: string
}

export const FileSelectorFileList = ({ search }: Props) => {
    const { id } = useWorkspace()
    const { data } = useSuspenseQuery(workspaceFilesQuery({
        id,
        filters: {
            search,
        }
    }))
    const files = data.items
    const meta = data.meta

    return (
        <ul className='w-full flex flex-col divide-y'>
            { meta.total === 0 && <li>No files found</li> }
            { files.map(file => (
                <FileSelectorFileCard
                    file={ file }
                    key={ file.id }
                />
            )) }
        </ul>
    )
}