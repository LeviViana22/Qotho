'use client'
import { useState, useRef, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ScrollBar from '@/components/ui/ScrollBar'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import wildCardSearch from '@/utils/wildCardSearch'
import classNames from '@/utils/classNames'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
import { useRegistroCivilUsers } from '../_hooks/useRegistroCivilUsers'
import { useRegistroCivilAccess } from '../_hooks/useRegistroCivilAccess'
import useUserStore from '@/stores/userStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { TbSearch } from 'react-icons/tb'
import debounce from 'lodash/debounce'
import cloneDeep from 'lodash/cloneDeep'

const AddNewMemberContent = () => {
    const inputRef = useRef(null)

    const { closeDialog } = useRegistroCivilStore()
    const { currentUser } = useUserStore()
    
    // Get registro civil access control
    const { members: accessMembers, isAdmin } = useRegistroCivilAccess()
    
    // Get all users from the dedicated hook
    const { users: allUsers, hasUsers, isLoading } = useRegistroCivilUsers()
    
    // Use all users for the dialog (so removed users can be re-added)
    const allMembers = hasUsers ? allUsers : []
    const [memberList, setMemberList] = useState(allMembers)
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        member: null
    })
    
    // Update member list when users change
    useEffect(() => {
        if (hasUsers && allUsers) {
            setMemberList(allUsers)
        }
    }, [hasUsers, allUsers])

    const debounceFn = debounce(handleDebounceFn, 500)

    function handleDebounceFn(query) {
        const data = wildCardSearch(allMembers, query)
        setMemberList(data)
    }

    const onSearch = (e) => {
        debounceFn(e.target.value)
    }

    // Check admin permission and show toast if not authorized
    const checkAdminPermission = () => {
        if (!isAdmin) {
            toast.push(
                <Notification type="danger">Sem permissão!</Notification>,
                {
                    placement: 'top-center',
                }
            )
            return false
        }
        return true
    }

    const existingMember = (id) => {
        return accessMembers?.some((member) => member.id === id) || false
    }

    const onAddMember = async (member) => {
        if (!checkAdminPermission()) return
        
        console.log('Adding member to registro civil:', member)
        
        try {
            const response = await fetch('/api/registro-civil/members', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    members: [...(accessMembers || []), member]
                }),
            })
            
            if (response.ok) {
                // Show success toast
                toast.push(
                    <Notification type="success">Membro adicionado com sucesso!</Notification>,
                    {
                        placement: 'top-center',
                    }
                )
                
                // Refresh the page to update access control
                window.location.reload()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to add member')
            }
        } catch (error) {
            console.error('Error adding member:', error)
            toast.push(
                <Notification type="danger">Erro ao adicionar membro</Notification>,
                {
                    placement: 'top-center',
                }
            )
        }
    }

    const onRemoveMember = (member) => {
        if (!checkAdminPermission()) return
        
        setConfirmDialog({
            open: true,
            member: member
        })
    }

    const confirmRemoveMember = async () => {
        const { member } = confirmDialog
        if (!member) return

        try {
            const updatedMembers = (accessMembers || []).filter(m => m.id !== member.id)
            
            const response = await fetch('/api/registro-civil/members', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    members: updatedMembers
                }),
            })
            
            if (response.ok) {
                // Show success toast
                toast.push(
                    <Notification type="success">Membro removido com sucesso!</Notification>,
                    {
                        placement: 'top-center',
                    }
                )
                
                // Refresh the page to update access control
                window.location.reload()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to remove member')
            }
        } catch (error) {
            console.error('Error removing member:', error)
            toast.push(
                <Notification type="danger">Erro ao remover membro</Notification>,
                {
                    placement: 'top-center',
                }
            )
        }
        
        // Close confirmation dialog
        setConfirmDialog({ open: false, member: null })
    }

    const cancelRemoveMember = () => {
        setConfirmDialog({ open: false, member: null })
    }

    const onDone = () => {
        closeDialog()
    }

    // Show loading state
    if (isLoading) {
        return (
            <div>
                <div className="text-center mb-6">
                    <h4 className="mb-1">Adicionar membros</h4>
                    <p>Carregando usuários...</p>
                </div>
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="text-center mb-6">
                <h4 className="mb-1">Adicionar membros</h4>
                <p>Convide membros existentes para este projeto.</p>
            </div>
            <Input
                ref={inputRef}
                prefix={<TbSearch className="text-lg" />}
                placeholder="Pesquisa rápida de membro"
                onChange={onSearch}
            />
            <div className="mt-4">
                <p className="font-semibold uppercase text-xs mb-4">
                    {memberList.length} membros disponíveis
                </p>
                <div className="mb-6">
                    <ScrollBar className={classNames('overflow-y-auto h-80')}>
                        {memberList.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Nenhum usuário encontrado.</p>
                                <p className="text-sm mt-1">Verifique se há usuários cadastrados no sistema.</p>
                            </div>
                        ) : (
                            memberList.map((member) => (
                            <div
                                key={member.id}
                                className="py-3 pr-5 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar shape="circle" src={member.img} />
                                    <div>
                                        <p className="heading-text font-bold">
                                            {member.name}
                                        </p>
                                        <p>{member.email}</p>
                                    </div>
                                </div>
                                {isAdmin ? (
                                    existingMember(member.id) ? (
                                        <Button
                                            size="xs"
                                            customColorClass={() =>
                                                'hover:border-red-500 hover:ring-red-500'
                                            }
                                            onClick={() =>
                                                onRemoveMember(member)
                                            }
                                        >
                                            <span className="text-red-500">
                                                Remover
                                            </span>
                                        </Button>
                                    ) : (
                                        <Button
                                            size="xs"
                                            onClick={() => onAddMember(member)}
                                        >
                                            <span className="text-green-500">
                                                Adicionar
                                            </span>
                                        </Button>
                                    )
                                ) : (
                                    <span className="text-sm text-gray-500">
                                        {existingMember(member.id) ? 'Tem Acesso' : 'Sem Acesso'}
                                    </span>
                                )}
                            </div>
                            ))
                        )}
                    </ScrollBar>
                </div>
                <Button block variant="solid" onClick={onDone}>
                    Fechar
                </Button>
            </div>
            
            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.open}
                onClose={cancelRemoveMember}
                onRequestClose={cancelRemoveMember}
                type="danger"
                title="Remover Membro"
                onCancel={cancelRemoveMember}
                onConfirm={confirmRemoveMember}
            >
                <p>
                    Tem certeza que deseja remover o acesso de <strong>{confirmDialog.member?.name}</strong> ao quadro Registro Civil?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Este usuário perderá acesso à página do quadro Registro Civil e não poderá mais ser adicionado a novos projetos, mas permanecerá nos projetos existentes.
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default AddNewMemberContent

