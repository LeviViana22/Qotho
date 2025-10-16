'use client'
import { useState } from 'react'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import FileIcon from '@/components/view/FileIcon'
import { truncateFileName } from '@/utils/textTruncate'

const FileSegment = (props) => {
    const { 
        fileType, 
        size, 
        sizeDisplay, 
        name, 
        onClick, 
        loading, 
        id,
        isSelected,
        isMultiSelectMode,
        onMark,
        onDragStart,
        onDragEnd,
        onDrop,
        ...rest 
    } = props

    const [isDragging, setIsDragging] = useState(false)

    const handleClick = (e) => {
        if (isMultiSelectMode) {
            e.stopPropagation()
            onMark?.()
        } else {
            onClick?.()
        }
    }

    const handleDragStart = (e) => {
        setIsDragging(true)
        onDragStart?.(e, id)
    }

    const handleDragEnd = (e) => {
        setIsDragging(false)
        onDragEnd?.(e)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        onDrop?.(e, id)
    }

    const getBorderClass = () => {
        if (isSelected) {
            return 'border-2 border-blue-500'
        }
        if (isDragging) {
            return 'border-2 border-gray-400 opacity-50'
        }
        return 'border border-gray-200 dark:border-transparent'
    }

    return (
        <div
            className={`bg-white rounded-2xl dark:bg-gray-800 ${getBorderClass()} py-4 px-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-[0_0_1rem_0.25rem_rgba(0,0,0,0.04),0px_2rem_1.5rem_-1rem_rgba(0,0,0,0.12)] cursor-pointer min-h-[80px] max-h-[80px]`}
            role="button"
            onClick={handleClick}
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {loading ? (
                <MediaSkeleton
                    avatarProps={{
                        width: 33,
                        height: 33,
                    }}
                />
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">
                            <FileIcon type={fileType || ''} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold heading-text truncate" title={name}>
                                {truncateFileName(name)}
                            </div>
                            <span className="text-xs truncate block">
                                {sizeDisplay !== undefined ? sizeDisplay : fileSizeUnit(size || 0)}
                            </span>
                        </div>
                    </div>
                    <FileItemDropdown {...rest} />
                </>
            )}
        </div>
    )
}

export default FileSegment
