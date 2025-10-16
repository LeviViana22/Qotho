'use client'

import { useState, useRef } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import InputGroup from '@/components/ui/InputGroup'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import sleep from '@/utils/sleep'
import classNames from '@/utils/classNames'
import { TbLink } from 'react-icons/tb'

const FileManagerInviteDialog = () => {
    const { inviteDialog, setInviteDialog } = useFileManagerStore()

    const inputRef = useRef(null)

    const [inviting, setInviting] = useState(false)
    const [selectedRole, setSelectedRole] = useState('reader')

    // Permission role options
    const roleOptions = [
        { value: 'reader', label: 'Visualizador' },
        { value: 'commenter', label: 'Comentador' },
        { value: 'writer', label: 'Editor' }
    ]

    const handleDialogClose = () => {
        setInviteDialog({ id: '', open: false })
    }

    const handleInvite = async () => {
        const email = inputRef.current?.value
        if (!email) return
        
        setInviting(true)
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch(`/api/files/${inviteDialog.id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ email, role: selectedRole }),
            })
            
            if (response.ok) {
                const result = await response.json()
                console.log('File shared successfully:', result)
                toast.push(
                    <Notification
                        type="success"
                        title="File shared successfully!"
                    ></Notification>,
                    { placement: 'top-end' },
                )
                inputRef.current.value = ''
                // Close the dialog after successful share
                setInviteDialog({ id: '', open: false })
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to share file')
            }
        } catch (error) {
            console.error('Share error:', error)
            toast.push(
                <Notification
                    type="danger"
                    title="Failed to share file"
                ></Notification>,
                { placement: 'top-end' },
            )
        } finally {
            setInviting(false)
        }
    }

    const handleCopy = async () => {
        toast.push(
            <Notification type="success" title="Copied!"></Notification>,
            { placement: 'top-end' },
        )
        navigator.clipboard.writeText(window.location.href)
    }

    return (
        <Dialog
            isOpen={inviteDialog.open}
            contentClassName="mt-[50%]"
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4>Compartilhar este arquivo</h4>
            <div className="mt-6">
                <InputGroup>
                    <Input
                        ref={inputRef}
                        placeholder="Email"
                        type="email"
                    />
                    <div style={{ minWidth: 140 }}>
                        <Select
                            isSearchable={false}
                            placeholder="Permissão"
                            value={roleOptions.find(option => option.value === selectedRole)}
                            options={roleOptions}
                            onChange={(option) => setSelectedRole(option.value)}
                        />
                    </div>
                </InputGroup>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <Button
                    variant="plain"
                    size="sm"
                    icon={<TbLink />}
                    onClick={handleCopy}
                >
                    Copiar link
                </Button>
                <Button 
                    variant="solid" 
                    size="sm" 
                    loading={inviting}
                    onClick={handleInvite}
                >
                    Convidar
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerInviteDialog
