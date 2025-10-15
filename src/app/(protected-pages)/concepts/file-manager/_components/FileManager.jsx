'use client'
import { useEffect, useState } from 'react'
import Table from '@/components/ui/Table'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import FileManagerHeader from './FileManagerHeader'
import FileSegment from './FileSegment'
import FileList from './FileList'
import FileDetails from './FileDetails'
import FileManagerDeleteDialog from './FileManagerDeleteDialog'
import FileManagerInviteDialog from './FileManagerInviteDialog'
import FileManagerRenameDialog from './FileManagerRenameDialog'
import GoogleDriveAuth from './GoogleDriveAuth'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { apiGetFiles } from '@/services/FileService'
import useSWRMutation from 'swr/mutation'

const { THead, Th, Tr } = Table

async function getFile(_, { arg }) {
    const data = await apiGetFiles({
        id: arg,
    })
    return data
}

const FileManager = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authError, setAuthError] = useState(null)
    
    const {
        layout,
        fileList,
        setFileList,
        setDeleteDialog,
        setInviteDialog,
        setRenameDialog,
        openedDirectoryId,
        setOpenedDirectoryId,
        setDirectories,
        setSelectedFile,
    } = useFileManagerStore()

    const { trigger, isMutating } = useSWRMutation(
        `/api/files/${openedDirectoryId}`,
        getFile,
        {
            onSuccess: (resp) => {
                setDirectories(resp.directory)
                setFileList(resp.list)
                setIsAuthenticated(true)
            },
            onError: (error) => {
                if (error.status === 401) {
                    setIsAuthenticated(false)
                    setAuthError('Please connect to Google Drive')
                } else {
                    setAuthError('Failed to load files')
                }
            }
        },
    )

    useEffect(() => {
        // Check URL parameters for auth status
        const urlParams = new URLSearchParams(window.location.search)
        const authSuccess = urlParams.get('success')
        const authError = urlParams.get('error')
        
        if (authSuccess === 'auth_success') {
            setIsAuthenticated(true)
            setAuthError(null)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (authError) {
            setAuthError('Authentication failed. Please try again.')
            setIsAuthenticated(false)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (fileList.length === 0) {
            trigger(openedDirectoryId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleShare = (id) => {
        setInviteDialog({ id, open: true })
    }

    const handleDelete = (id) => {
        setDeleteDialog({ id, open: true })
    }

    const handleDownload = async (fileId) => {
        try {
            const response = await fetch(`/api/files/${fileId}/download`)
            const data = await response.json()
            
            if (data.downloadUrl) {
                // Open the download URL in a new tab
                window.open(data.downloadUrl, '_blank')
            } else {
                throw new Error('No download URL received')
            }
        } catch (error) {
            console.error('Download error:', error)
            // Fallback to demo download
            const blob = new Blob(
                [
                    'This text file is created to demonstrate how file downloading works in our template demo.',
                ],
                { type: 'text/plain;charset=utf-8' },
            )

            const link = document.createElement('a')
            link.href = window.URL.createObjectURL(blob)
            link.download = 'sample-download-file'
            document.body.appendChild(link)

            link.click()

            document.body.removeChild(link)
            window.URL.revokeObjectURL(link.href)
        }
    }

    const handleRename = (id) => {
        setRenameDialog({ id, open: true })
    }

    const handleOpen = (id) => {
        setOpenedDirectoryId(id)
        trigger(id)
    }

    const handleEntryClick = () => {
        setOpenedDirectoryId('')
        trigger('')
    }

    const handleDirectoryClick = (id) => {
        setOpenedDirectoryId(id)
        trigger(id)
    }

    const handleClick = (fileId) => {
        setSelectedFile(fileId)
    }

    // Show authentication component if not authenticated
    if (!isAuthenticated) {
        return (
            <div>
                {authError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400">{authError}</p>
                    </div>
                )}
                <GoogleDriveAuth onAuthSuccess={() => setIsAuthenticated(true)} />
            </div>
        )
    }

    return (
        <>
            <div>
                <FileManagerHeader
                    onEntryClick={handleEntryClick}
                    onDirectoryClick={handleDirectoryClick}
                />
                <div className="mt-6">
                    {isMutating ? (
                        layout === 'grid' ? (
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mt-4 gap-4 lg:gap-6">
                                {Array.from(Array(4).keys()).map((item) => (
                                    <FileSegment
                                        key={item}
                                        loading={isMutating}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>File</Th>
                                        <Th>Size</Th>
                                        <Th>Type</Th>
                                        <Th></Th>
                                    </Tr>
                                </THead>
                                <TableRowSkeleton
                                    avatarInColumns={[0]}
                                    columns={4}
                                    rows={5}
                                    avatarProps={{
                                        width: 30,
                                        height: 30,
                                    }}
                                />
                            </Table>
                        )
                    ) : (
                        <FileList
                            fileList={fileList}
                            layout={layout}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onOpen={handleOpen}
                            onClick={handleClick}
                        />
                    )}
                </div>
            </div>
            <FileDetails onShare={handleShare} />
            <FileManagerDeleteDialog />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog />
        </>
    )
}

export default FileManager
