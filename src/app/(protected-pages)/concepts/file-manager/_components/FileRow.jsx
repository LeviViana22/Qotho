'use client'
import Table from '@/components/ui/Table'
import FileType from './FileType'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import FileIcon from '@/components/view/FileIcon'
import { truncateFileName } from '@/utils/textTruncate'

const { Tr, Td } = Table

const FileRow = (props) => {
    const { fileType, size, sizeDisplay, name, onClick, ...rest } = props

    return (
        <Tr>
            <Td width="70%">
                <div
                    className="inline-flex items-center gap-2 cursor-pointer group"
                    role="button"
                    onClick={onClick}
                >
                    <div className="text-3xl">
                        <FileIcon type={fileType || ''} />
                    </div>
                    <div className="font-bold heading-text group-hover:text-primary truncate max-w-[200px]" title={name}>
                        {truncateFileName(name)}
                    </div>
                </div>
            </Td>
            <Td>{sizeDisplay !== undefined ? sizeDisplay : fileSizeUnit(size || 0)}</Td>
            <Td>
                <FileType type={fileType || ''} />
            </Td>
            <Td>
                <div className="flex justify-end">
                    <FileItemDropdown {...rest} />
                </div>
            </Td>
        </Tr>
    )
}

export default FileRow
