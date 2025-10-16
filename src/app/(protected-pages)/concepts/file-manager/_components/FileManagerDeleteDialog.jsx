'use client'

import { useFileManagerStore } from '../_store/useFileManagerStore'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

const FileManagerDeleteDialog = () => {
    const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore()

    const handleDeleteDialogClose = () => {
        setDeleteDialog({ id: '', open: false })
    }

    const handleDeleteConfirm = () => {
        deleteFile(deleteDialog.id)
        setDeleteDialog({ id: '', open: false })
    }

    return (
        <ConfirmDialog
            isOpen={deleteDialog.open}
            type="danger"
            title="Excluir arquivo"
            onClose={handleDeleteDialogClose}
            onRequestClose={handleDeleteDialogClose}
            onCancel={handleDeleteDialogClose}
            onConfirm={handleDeleteConfirm}
        >
            <p>
                Tem certeza que deseja excluir o arquivo? Esta ação não pode ser
                desfeita.{' '}
            </p>
        </ConfirmDialog>
    )
}

export default FileManagerDeleteDialog
