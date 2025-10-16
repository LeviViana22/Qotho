'use client'
import { useMemo } from 'react'
import Table from '@/components/ui/Table'
import FileSegment from './FileSegment'
import FileRow from './FileRow'

const { TBody, THead, Th, Tr } = Table

const FileList = (props) => {
    const {
        layout,
        fileList,
        onDelete,
        onDownload,
        onShare,
        onRename,
        onOpen,
        onClick,
        selectedFiles,
        isMultiSelectMode,
        onMark,
        onDragStart,
        onDragEnd,
        onDrop,
    } = props

    // Debug: Log the first file to see if sizeDisplay is present
    console.log('FileList received files:', fileList.length, fileList[0])

    const folders = useMemo(() => {
        return fileList.filter((file) => file.fileType === 'directory')
    }, [fileList])

    const files = useMemo(() => {
        return fileList.filter((file) => file.fileType !== 'directory')
    }, [fileList])

    const renderFileSegment = (list, isFolder) => (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
            {list.map((file) => (
                <FileSegment
                    key={file.id}
                    id={file.id}
                    fileType={file.fileType}
                    size={file.size}
                    sizeDisplay={file.sizeDisplay}
                    name={file.name}
                    isSelected={selectedFiles.includes(file.id)}
                    isMultiSelectMode={isMultiSelectMode}
                    onClick={isFolder ? () => onOpen(file.id) : () => onClick(file.id)}
                    onDownload={() => onDownload(file.id)}
                    onShare={() => onShare(file.id)}
                    onDelete={() => onDelete(file.id)}
                    onRename={() => onRename(file.id)}
                    onMark={() => onMark(file.id)}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDrop={onDrop}
                    {...(isFolder ? { onDetails: () => onClick(file.id) } : {})}
                />
            ))}
        </div>
    )

    const renderFileRow = (list, isFolder) => (
        <Table className="mt-4">
            <THead>
                <Tr>
                    <Th>File</Th>
                    <Th>Size</Th>
                    <Th>Type</Th>
                    <Th></Th>
                </Tr>
            </THead>
            <TBody>
                {list.map((file) => (
                    <FileRow
                        key={file.id}
                        fileType={file.fileType}
                        size={file.size}
                        sizeDisplay={file.sizeDisplay}
                        name={file.name}
                        onClick={isFolder ? () => onOpen(file.id) : () => onClick(file.id)}
                        onDownload={() => onDownload(file.id)}
                        onShare={() => onShare(file.id)}
                        onDelete={() => onDelete(file.id)}
                        onRename={() => onRename(file.id)}
                        {...(isFolder ? { onDetails: () => onClick(file.id) } : {})}
                    />
                ))}
            </TBody>
        </Table>
    )

    return (
        <div>
            {folders.length > 0 && (
                <div>
                    <h4>Pastas</h4>
                    {layout === 'grid' && renderFileSegment(folders, true)}
                    {layout === 'list' && renderFileRow(folders, true)}
                </div>
            )}
            {files.length > 0 && (
                <div className="mt-8">
                    <h4>Arquivos</h4>
                    {layout === 'grid' && renderFileSegment(files)}
                    {layout === 'list' && renderFileRow(files)}
                </div>
            )}
        </div>
    )
}

export default FileList
