'use client'

import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { useFileManagerStore } from '../_store/useFileManagerStore'

const FileManagerUploadFolderDialog = ({ onRefresh }) => {
    const { uploadFolderDialog, setUploadFolderDialog, uploadFolder } = useFileManagerStore()

    const handleDialogClose = () => {
        setUploadFolderDialog({ open: false, files: [] })
    }

    const handleConfirmUpload = async () => {
        if (uploadFolderDialog.files && uploadFolderDialog.files.length > 0) {
            try {
                console.log('Dialog: Starting upload with files:', uploadFolderDialog.files.length)
                console.log('Dialog: Files:', uploadFolderDialog.files.map(f => ({ name: f.name, size: f.size, type: f.type })))
                await uploadFolder(uploadFolderDialog.files)
                setUploadFolderDialog({ open: false, files: [] })
                // Trigger refresh in parent component
                if (onRefresh) {
                    onRefresh()
                }
            } catch (error) {
                console.error('Error uploading folder:', error)
                // Keep dialog open on error so user can try again
            }
        } else {
            console.error('Dialog: No files to upload')
        }
    }

    const fileCount = uploadFolderDialog.files ? uploadFolderDialog.files.length : 0
    const folderName = uploadFolderDialog.files && uploadFolderDialog.files.length > 0 
        ? uploadFolderDialog.files[0].webkitRelativePath.split('/')[0] 
        : ''

    return (
        <Dialog
            isOpen={uploadFolderDialog.open}
            contentClassName="mt-[50%]"
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4>Confirmar Upload de Pasta</h4>
            <div className="mt-6">
                <p className="text-gray-600 dark:text-gray-400">
                    Pasta selecionada: <strong>"{folderName}"</strong>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                    Total de arquivos: <strong>{fileCount}</strong> arquivo{fileCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Deseja fazer upload desta pasta para o Google Drive?
                </p>
            </div>
            <div className="mt-6 flex justify-end items-center gap-2">
                <Button size="sm" onClick={handleDialogClose}>
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    onClick={handleConfirmUpload}
                >
                    <span className="flex justify-center min-w-10">Confirmar Upload</span>
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerUploadFolderDialog
