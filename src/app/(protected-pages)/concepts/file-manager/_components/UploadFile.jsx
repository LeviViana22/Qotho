'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import sleep from '@/utils/sleep'

const UploadFile = () => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const { openedDirectoryId } = useFileManagerStore()

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return
        
        setIsUploading(true)
        try {
            const formData = new FormData()
            uploadedFiles.forEach((file) => {
                formData.append('file', file)
            })
            
            // Add the current directory ID as parent
            const parentId = openedDirectoryId || 'root'
            formData.append('parentId', parentId)
            
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader
                },
                body: formData,
            })
            
            if (response.ok) {
                const result = await response.json()
                handleUploadDialogClose()
                setUploadedFiles([])
                
                const successMessage = result.uploaded === result.total 
                    ? `Successfully uploaded ${result.uploaded} file${result.uploaded > 1 ? 's' : ''}`
                    : `Uploaded ${result.uploaded} of ${result.total} files`
                
                toast.push(
                    <Notification title={successMessage} type="success" />,
                    { placement: 'top-center' },
                )
                // Refresh the file list
                window.location.reload()
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('Upload failed:', response.status, errorData)
                throw new Error(errorData.error || `Upload failed with status ${response.status}`)
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.push(
                <Notification title={error.message || 'Upload failed'} type="danger" />,
                { placement: 'top-center' },
            )
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <Button variant="solid" onClick={() => setUploadDialogOpen(true)}>
                Upload
            </Button>
            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4>Upload de arquivos</h4>
                <Upload
                    draggable
                    className="mt-6 bg-gray-100 dark:bg-transparent"
                    onChange={setUploadedFiles}
                    onFileRemove={setUploadedFiles}
                >
                    <div className="my-4 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={150} width={200} />
                        </div>
                        <p className="font-semibold">
                            <span className="text-gray-800 dark:text-white">
                                Arraste e solte seus arquivos aqui, ou{' '}
                            </span>
                            <span className="text-blue-500">navegue</span>
                        </p>
                        <p className="mt-1 font-semibold opacity-60 dark:text-white">
                            pelo seu computador
                        </p>
                    </div>
                </Upload>
                <div className="mt-4">
                    <Button
                        block
                        loading={isUploading}
                        variant="solid"
                        disabled={uploadedFiles.length === 0}
                        onClick={handleUpload}
                    >
                        Upload
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default UploadFile
