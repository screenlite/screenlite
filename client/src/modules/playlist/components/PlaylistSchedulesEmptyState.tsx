export const PlaylistSchedulesEmptyState = () => {
    return (
        <div className='col-span-2 flex flex-col items-center justify-center py-16 text-neutral-400 gap-2'>
            <div className='text-lg font-medium'>No schedules yet</div>
            <div className='text-sm'>Add a schedule to control when this playlist plays</div>
        </div>
    )
}
