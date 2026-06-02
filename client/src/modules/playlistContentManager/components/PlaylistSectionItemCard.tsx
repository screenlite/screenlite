import { useSortable } from '@dnd-kit/sortable'
import { createElement, forwardRef } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { PlaylistContentManagerItem } from '@modules/playlist/types'
import { SectionItemsFileItemCardBody } from './SectionItems/SectionItemsFileItemCardBody'
import React from 'react'

interface PlaylistSectionItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
    item: PlaylistContentManagerItem
    isDragging?: boolean
}

export const PlaylistSectionItemCard = forwardRef<HTMLDivElement, PlaylistSectionItemCardProps>(({ item, isDragging, ...props }, ref) => {
    const getCardBodyComponent = () => {
        switch (item.type) {
            case 'file':
                return SectionItemsFileItemCardBody
            default:
                return () => <div>Unknown type</div>
        }
    }

    return (
        <div
            { ...props }
            className={ [
                'cursor-default p-3',
                isDragging ? 'bg-gray-100' : 'hover:bg-gray-100',
            ].join(' ') }
            ref={ ref }
        >
            { createElement(getCardBodyComponent(), { item }) }
        </div>
    )
})

export const PlaylistSectionSortableItemCard = (props: { item: PlaylistContentManagerItem }) => {
    const { item } = props

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        data: {
            item,
            action: 'sort',
            modifiers: [restrictToVerticalAxis, restrictToParentElement],
        }
    })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
        userSelect: 'none',
    }
    
    return (
        <PlaylistSectionItemCard
            item={ item }
            ref={ setNodeRef }
            style={ style }
            { ...attributes }
            { ...listeners }
        />
    )
}