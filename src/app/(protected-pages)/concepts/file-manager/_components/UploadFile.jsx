'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import sleep from '@/utils/sleep'

const UploadFile = () => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])

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
            
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            })
            
            if (response.ok) {
                handleUploadDialogClose()
                setUploadedFiles([])
                toast.push(
                    <Notification title={'Successfully uploaded'} type="success" />,
                    { placement: 'top-center' },
                )
                // Refresh the file list
                window.location.reload()
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.push(
                <Notification title={'Upload failed'} type="danger" />,
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
                <h4>Upload Files</h4>
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
                                Drop your files here, or{' '}
                            </span>
                            <span className="text-blue-500">browse</span>
                        </p>
                        <p className="mt-1 font-semibold opacity-60 dark:text-white">
                            through your machine
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
