'use client'
import { useRef } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import Tooltip from '@/components/ui/Tooltip'
import Badge from '@/components/ui/Badge'
import ActionButton from './ActionButton'
import { useMailStore } from '../_store/mailStore'
import useMailAction from '../_hooks/useMailAction'
import { groupList } from '../constants'
import classNames from '@/utils/classNames'
import {
    TbDotsVertical,
    TbArrowBackUp,
    TbStarFilled,
    TbFlag,
    TbFolderSymlink,
    TbStar,
} from 'react-icons/tb'

const MailDetailAction = () => {
    const dropdownRef = useRef(null)

    const { mail, toggleMessageDialog } = useMailStore()
    const flaggedIds = useMailStore((state) => state.flaggedIds)
    const toggleEmailFlag = useMailStore((state) => state.toggleEmailFlag)
    const starredIds = useMailStore((state) => state.starredIds)
    const toggleEmailStar = useMailStore((state) => state.toggleEmailStar)

    const { onMoveMailClick } = useMailAction()

    const handleMoveMailClick = (destination) => {
        onMoveMailClick(mail, destination)
        dropdownRef.current?.handleDropdownClose()
    }

    const handleReplyClick = () => {
        toggleMessageDialog({
            mode: 'reply',
            open: true,
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Tooltip title="Responder">
                <ActionButton onClick={handleReplyClick}>
                    <TbArrowBackUp />
                </ActionButton>
            </Tooltip>
            <Dropdown
                ref={dropdownRef}
                placement="bottom-end"
                renderTitle={
                    <ActionButton>
                        <TbDotsVertical />
                    </ActionButton>
                }
            >
                <Dropdown.Item
                    eventKey="star"
                    onClick={() => toggleEmailStar(mail.id)}
                >
                    <span className="text-lg">
                        {starredIds.has(mail.id) ? (
                            <TbStarFilled className="text-amber-500" />
                        ) : (
                            <TbStar />
                        )}
                    </span>
                    <span>Favoritar</span>
                </Dropdown.Item>
                <Dropdown.Item
                    eventKey="flag"
                    onClick={() => toggleEmailFlag(mail.id)}
                >
                    <TbFlag className={classNames(
                        'text-lg',
                        flaggedIds.has(mail.id) ? 'text-red-500' : 'text-gray-400',
                    )} />
                    <span>Marcar</span>
                </Dropdown.Item>
                <Dropdown.Menu
                    renderTitle={
                        <>
                            <span className="flex items-center gap-2">
                                <TbFolderSymlink className="text-lg" />
                                <span>Mover para</span>
                            </span>
                        </>
                    }
                    placement="left-start"
                >
                    {groupList.filter(item => item.value !== 'deleted').map((item) => (
                        <Dropdown.Item
                            key={item.value}
                            onClick={() => handleMoveMailClick(item.value)}
                        >
                            <span>{item.label}</span>
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    )
}

export default MailDetailAction
