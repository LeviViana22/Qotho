'use client'
import { useRef } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import {
    TbCloudDownload,
    TbPencil,
    TbUserPlus,
    TbTrash,
    TbFolderSymlink,
    TbInfoCircle,
    TbCheck,
} from 'react-icons/tb'

const FileItemDropdown = (props) => {
    const { onDelete, onShare, onRename, onDownload, onOpen, onDetails, onMark, isMarked } = props

    const dropdownRef = useRef(null)

    const handleDropdownClick = (e) => {
        e.stopPropagation()
        dropdownRef.current?.handleDropdownOpen()
    }

    const handleDropdownItemClick = (e, callback) => {
        e.stopPropagation()
        callback?.()
    }

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<EllipsisButton onClick={handleDropdownClick} />}
            placement="bottom-end"
        >
            {onMark && (
                <Dropdown.Item
                    eventKey="Mark"
                    onClick={(e) => handleDropdownItemClick(e, onMark)}
                >
                    <TbCheck className="text-xl" />
                    <span>{isMarked ? 'Desmarcar' : 'Marcar'}</span>
                </Dropdown.Item>
            )}
            {onDetails && (
                <Dropdown.Item
                    eventKey="Details"
                    onClick={(e) => handleDropdownItemClick(e, onDetails)}
                >
                    <TbInfoCircle className="text-xl" />
                    <span>Details</span>
                </Dropdown.Item>
            )}
            <Dropdown.Item
                eventKey="download"
                onClick={(e) => handleDropdownItemClick(e, onDownload)}
            >
                <TbCloudDownload className="text-xl" />
                <span>Download</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="rename"
                onClick={(e) => handleDropdownItemClick(e, onRename)}
            >
                <TbPencil className="text-xl" />
                <span>Renomear</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="share"
                onClick={(e) => handleDropdownItemClick(e, onShare)}
            >
                <TbUserPlus className="text-xl" />
                <span>Compartilhar</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="share"
                onClick={(e) => handleDropdownItemClick(e, onDelete)}
            >
                <span className="flex items-center gap-2 text-error">
                    <TbTrash className="text-xl" />
                    <span>Excluir</span>
                </span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default FileItemDropdown
