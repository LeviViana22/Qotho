'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import DebouceInput from '@/components/shared/DebouceInput'
import { useFileManagerStore } from '../_store/useFileManagerStore'

const FileManagerCreateFolderDialog = () => {
    const { createFolderDialog, setCreateFolderDialog, createFolder } = useFileManagerStore()

    const [folderName, setFolderName] = useState('')

    const handleDialogClose = () => {
        setCreateFolderDialog({ open: false })
        setFolderName('')
    }

    const handleSubmit = () => {
        if (folderName.trim()) {
            createFolder(folderName.trim())
            setCreateFolderDialog({ open: false })
            setFolderName('')
        }
    }

    return (
        <Dialog
            isOpen={createFolderDialog.open}
            contentClassName="mt-[50%]"
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4>Criar Nova Pasta</h4>
            <div className="mt-6">
                <DebouceInput
                    placeholder="Nome da pasta"
                    type="text"
                    onChange={(e) => setFolderName(e.target.value)}
                />
            </div>
            <div className="mt-6 flex justify-end items-center gap-2">
                <Button size="sm" onClick={handleDialogClose}>
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    disabled={folderName.trim().length === 0}
                    onClick={handleSubmit}
                >
                    <span className="flex justify-center min-w-10">Criar</span>
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerCreateFolderDialog
