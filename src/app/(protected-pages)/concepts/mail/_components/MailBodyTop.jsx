'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Badge from '@/components/ui/Badge'
import MailDeleteConfimation from './MailDeleteConfimation'
import useResponsive from '@/utils/hooks/useResponsive'
import { useMailStore } from '../_store/mailStore'
import useMailAction from '../_hooks/useMailAction'
import { groupList } from '../constants'
import { TbMail, TbTrash, TbMenu2 } from 'react-icons/tb'

const MailBodyTop = () => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isClient, setIsClient] = useState(false)

    const { selectedMailId, toggleMessageDialog, toggleMobileSidebar } =
        useMailStore()

    const { onMailDelete, onBatchMoveMailClick } = useMailAction()

    const { smaller } = useResponsive()

    const hasMailSelected = selectedMailId.length > 0

    useEffect(() => {
        setIsClient(true)
    }, [])

    const handleClose = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleConfirmDelete = () => {
        onMailDelete(selectedMailId)
        handleClose()
    }

    const handleMoveMailClick = (destination) => {
        onBatchMoveMailClick(selectedMailId, destination)
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    {isClient && smaller.xl && (
                        <button
                            className="close-button"
                            type="button"
                            onClick={() => toggleMobileSidebar(true)}
                        >
                            <TbMenu2 />
                        </button>
                    )}
                    {hasMailSelected && (
                        <h5>{selectedMailId.length} items selected</h5>
                    )}
                </div>
                <div className="inline-flex items-center gap-2">
                    {hasMailSelected ? (
                        <>
                            <Dropdown
                                renderTitle={<Button size="sm">Mover para</Button>}
                                placement="bottom-end"
                            >
                                {groupList.filter(item => item.value !== 'deleted').map((item) => (
                                    <Dropdown.Item
                                        key={item.value}
                                        onClick={() =>
                                            handleMoveMailClick(item.value)
                                        }
                                    >
                                        <span>{item.label}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown>
                            <Button
                                size="sm"
                                type="button"
                                customColorClass={() =>
                                    'border-error ring-0 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-transparent'
                                }
                                icon={<TbTrash />}
                                onClick={() => setDeleteConfirmationOpen(true)}
                            >
                                Deletar
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="solid"
                            icon={<TbMail />}
                            size="sm"
                            onClick={() =>
                                toggleMessageDialog({
                                    open: true,
                                    mode: 'new',
                                })
                            }
                        >
                            Criar
                        </Button>
                    )}
                </div>
            </div>
            <MailDeleteConfimation
                isOpen={deleteConfirmationOpen}
                selectedMailCount={selectedMailId.length}
                onClose={handleClose}
                onConfirmDelete={handleConfirmDelete}
            />
        </>
    )
}

export default MailBodyTop
