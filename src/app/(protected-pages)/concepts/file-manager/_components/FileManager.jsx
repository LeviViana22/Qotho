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
import FileManagerCreateFolderDialog from './FileManagerCreateFolderDialog'
import FileManagerUploadFolderDialog from './FileManagerUploadFolderDialog'
import GoogleDriveAuth from './GoogleDriveAuth'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { apiGetFiles, apiGetFolderSize } from '@/services/FileService'
import useSWRMutation from 'swr/mutation'
import { formatFolderSize } from '@/utils/folderSizeDisplay'

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
    const [folderSizes, setFolderSizes] = useState({})
    const [calculatingSizes, setCalculatingSizes] = useState(new Set())
    const [showConnectPage, setShowConnectPage] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    
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
        selectedFiles,
        isMultiSelectMode,
        toggleFileSelection,
        clearSelection,
        moveFiles,
    } = useFileManagerStore()

    const { trigger, isMutating } = useSWRMutation(
        `/api/files/${openedDirectoryId}`,
        getFile,
        {
            onSuccess: (resp) => {
                setDirectories(resp.directory)
                setFileList(resp.list)
                setIsAuthenticated(true)
                setAuthError(null)
            },
            onError: (error) => {
                console.error('File loading error:', error)
                if (error.message?.includes('No Google Drive access token')) {
                    setIsAuthenticated(false)
                    setAuthError('Please connect to Google Drive')
                } else if (error.status === 401) {
                    setIsAuthenticated(false)
                    setAuthError('Authentication expired. Please reconnect.')
                    // Clear expired tokens
                    localStorage.removeItem('googleDriveTokens')
                } else {
                    setAuthError('Failed to load files')
                }
            }
        },
    )

    useEffect(() => {
        console.log('FileManager useEffect - Checking authentication status')
        
        // Check if we're coming from the go back button
        const urlParams = new URLSearchParams(window.location.search)
        const fromGoBack = urlParams.get('from') === 'go-back'
        console.log('Coming from go back button:', fromGoBack)
        
        // If coming from go back, show connect page but check auth status
        if (fromGoBack) {
            console.log('Coming from go back, checking auth status')
            setShowConnectPage(true)
            setAuthError(null)
            
            // Check if we have valid tokens to determine connection status
            const storedTokens = localStorage.getItem('googleDriveTokens')
            if (storedTokens) {
                try {
                    const tokenData = JSON.parse(storedTokens)
                    if (tokenData.expiry_date && tokenData.expiry_date > Date.now()) {
                        console.log('Valid tokens found, user is authenticated')
                        setIsAuthenticated(true)
                    } else {
                        console.log('Tokens expired')
                        setIsAuthenticated(false)
                    }
                } catch (error) {
                    console.error('Error parsing stored tokens:', error)
                    setIsAuthenticated(false)
                }
            } else {
                console.log('No stored tokens found')
                setIsAuthenticated(false)
            }
            
            // Clean up the URL parameter
            window.history.replaceState({}, '', '/concepts/file-manager')
            
            // Mark initialization as complete for go back flow
            setIsInitializing(false)
            return
        }
        
        // First, check if we have stored tokens in localStorage
        const storedTokens = localStorage.getItem('googleDriveTokens')
        console.log('Stored tokens found:', !!storedTokens)
        
        if (storedTokens) {
            try {
                const tokenData = JSON.parse(storedTokens)
                console.log('Parsed token data:', { 
                    hasAccessToken: !!tokenData.access_token,
                    hasRefreshToken: !!tokenData.refresh_token,
                    expiryDate: tokenData.expiry_date
                })
                
                // Check if token is still valid (not expired)
                if (tokenData.expiry_date && tokenData.expiry_date > Date.now()) {
                    console.log('Tokens are valid, setting authenticated')
                    setIsAuthenticated(true)
                    setAuthError(null)
                    if (fileList.length === 0) {
                        trigger(openedDirectoryId)
                    }
                } else {
                    console.log('Tokens expired, removing')
                    localStorage.removeItem('googleDriveTokens')
                    setIsAuthenticated(false)
                    setAuthError('Authentication expired. Please reconnect.')
                }
            } catch (error) {
                console.error('Error parsing stored tokens:', error)
                localStorage.removeItem('googleDriveTokens')
                setIsAuthenticated(false)
                setAuthError('Invalid stored tokens. Please reconnect.')
            }
        } else {
            console.log('No stored tokens found')
            setIsAuthenticated(false)
            setAuthError('Please connect to Google Drive')
        }
        
        // Also check URL parameters for backward compatibility (old redirect flow)
        const authSuccess = urlParams.get('success')
        const authError = urlParams.get('error')
        const tokensParam = urlParams.get('tokens')
        
        if (authSuccess === 'auth_success' && tokensParam) {
            console.log('Processing tokens from URL (legacy flow)')
            try {
                const tokenData = JSON.parse(atob(tokensParam))
                localStorage.setItem('googleDriveTokens', JSON.stringify(tokenData))
                setIsAuthenticated(true)
                setAuthError(null)
                
                // Clean up URL
                setTimeout(() => {
                    window.history.replaceState({}, document.title, window.location.pathname)
                }, 1000)
                
                trigger(openedDirectoryId)
            } catch (error) {
                console.error('Error parsing URL tokens:', error)
                setAuthError('Failed to process authentication tokens.')
                setIsAuthenticated(false)
            }
        } else if (authError) {
            setAuthError('Authentication failed. Please try again.')
            setIsAuthenticated(false)
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname)
            }, 1000)
        }
        
        // Mark initialization as complete
        setIsInitializing(false)
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
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch(`/api/files/${fileId}/download`, {
                headers: {
                    'Authorization': authHeader
                }
            })
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`)
            }
            
            // Get the download URL from the response
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

    // Multi-selection handlers
    const handleMark = (fileId) => {
        toggleFileSelection(fileId)
    }

    const handleCancelSelection = () => {
        clearSelection()
    }

    const handleMoveFiles = () => {
        // TODO: Open folder selection dialog
        console.log('Move files:', selectedFiles)
    }

    // Drag and drop handlers
    const handleDragStart = (e, fileId) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', fileId)
        
        // If we're in multi-select mode and this file is selected, drag all selected files
        if (isMultiSelectMode && selectedFiles.includes(fileId)) {
            e.dataTransfer.setData('application/json', JSON.stringify(selectedFiles))
        } else {
            e.dataTransfer.setData('application/json', JSON.stringify([fileId]))
        }
    }

    const handleDragEnd = (e) => {
        e.dataTransfer.clearData()
    }

    const handleDrop = (e, targetFileId) => {
        e.preventDefault()
        
        try {
            const draggedFileIds = JSON.parse(e.dataTransfer.getData('application/json'))
            const targetFolderId = targetFileId
            
            // Don't allow dropping on the same file or on a file that's being dragged
            if (draggedFileIds.includes(targetFileId)) {
                return
            }
            
            // Move the files
            moveFiles(draggedFileIds, targetFolderId).then(() => {
                // Refresh the file list
                trigger()
            }).catch(error => {
                console.error('Error moving files:', error)
                alert('Erro ao mover arquivos: ' + error.message)
            })
        } catch (error) {
            console.error('Error parsing drag data:', error)
        }
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

    const handleGoBack = () => {
        // Navigate back to the connect page without losing tokens
        // Add a parameter to indicate we're coming from go back
        window.location.href = '/concepts/file-manager?from=go-back'
    }

    const handleClick = (fileId) => {
        setSelectedFile(fileId)
    }

    // Calculate folder sizes for folders in the current file list
    const calculateFolderSizes = async (files) => {
        const folders = files.filter(file => file.fileType === 'directory')
        
        // Process folders in batches to avoid overwhelming the API
        const batchSize = 3
        for (let i = 0; i < folders.length; i += batchSize) {
            const batch = folders.slice(i, i + batchSize)
            
            // Process batch in parallel
            const promises = batch.map(async (folder) => {
                if (folderSizes[folder.id] !== undefined) {
                    return // Already calculated
                }
                
                setCalculatingSizes(prev => new Set([...prev, folder.id]))
                
                try {
                    const response = await apiGetFolderSize(folder.id)
                    console.log(`Folder size API response for ${folder.id}:`, response)
                    setFolderSizes(prev => ({
                        ...prev,
                        [folder.id]: response.size || 0
                    }))
                } catch (error) {
                    console.error('Error calculating folder size:', error)
                    console.error('Error details:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    })
                    
                    // Set a fallback size based on error type
                    let fallbackSize = 0
                    if (error.response?.status === 401) {
                        console.log('Authentication error, folder size unavailable')
                    } else if (error.response?.status === 403) {
                        console.log('Permission error, folder size unavailable')
                    } else {
                        console.log('Unknown error, assuming empty folder')
                    }
                    
                    setFolderSizes(prev => ({
                        ...prev,
                        [folder.id]: fallbackSize
                    }))
                } finally {
                    setCalculatingSizes(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(folder.id)
                        return newSet
                    })
                }
            })
            
            // Wait for batch to complete before processing next batch
            await Promise.all(promises)
            
            // Small delay between batches to avoid overwhelming the API
            if (i + batchSize < folders.length) {
                await new Promise(resolve => setTimeout(resolve, 200))
            }
        }
    }

    // Update files with calculated folder sizes
    const updateFilesWithSizes = (files) => {
        return files.map(file => {
            if (file.fileType === 'directory') {
                const size = folderSizes[file.id] !== undefined ? folderSizes[file.id] : 0
                const isCalculating = calculatingSizes.has(file.id)
                const sizeDisplay = formatFolderSize(size, true, isCalculating)
                console.log('Updating folder size:', { id: file.id, size, isCalculating, sizeDisplay })
                return {
                    ...file,
                    size: size,
                    sizeDisplay: sizeDisplay
                }
            }
            return {
                ...file,
                sizeDisplay: undefined // Ensure all files have sizeDisplay property
            }
        })
    }

    // Filter files based on search query
    const filterFiles = (files, query) => {
        if (!query || query.trim() === '') {
            return files
        }
        
        const searchTerm = query.toLowerCase().trim()
        return files.filter(file => {
            const fileName = file.name.toLowerCase()
            return fileName.includes(searchTerm)
        })
    }

    // Calculate folder sizes when fileList changes
    useEffect(() => {
        if (fileList.length > 0) {
            // Defer folder size calculation to avoid blocking UI
            setTimeout(() => {
                calculateFolderSizes(fileList)
            }, 100)
        }
    }, [fileList])

    // Show loading state while initializing
    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    // Show authentication component if not authenticated or if showing connect page
    if (!isAuthenticated || showConnectPage) {
        return (
            <div>
                {authError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400">{authError}</p>
                    </div>
                )}
                <GoogleDriveAuth 
                    onAuthSuccess={() => {
                        console.log('Auth success callback triggered')
                        // Re-check localStorage for tokens
                        const storedTokens = localStorage.getItem('googleDriveTokens')
                        if (storedTokens) {
                            console.log('Tokens found in localStorage, setting authenticated')
                            setIsAuthenticated(true)
                            setAuthError(null)
                            setShowConnectPage(false)
                            // Trigger file loading
                            trigger(openedDirectoryId)
                        } else {
                            console.log('No tokens found in localStorage after auth success')
                            setIsAuthenticated(false)
                            setAuthError('Authentication failed - no tokens stored')
                        }
                    }} 
                    onDisconnect={() => {
                        console.log('Disconnect callback triggered')
                        setIsAuthenticated(false)
                        setAuthError('Disconnected from Google Drive')
                        setShowConnectPage(false)
                        setFileList([])
                        setDirectories([])
                        setFolderSizes({})
                        setCalculatingSizes(new Set())
                    }}
                    isConnected={isAuthenticated}
                />
            </div>
        )
    }

    return (
        <>
            <div>
                <FileManagerHeader
                    onEntryClick={handleEntryClick}
                    onDirectoryClick={handleDirectoryClick}
                    onGoBack={handleGoBack}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onCancelSelection={handleCancelSelection}
                    onMoveFiles={handleMoveFiles}
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
                            fileList={filterFiles(updateFilesWithSizes(fileList), searchQuery)}
                            layout={layout}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onOpen={handleOpen}
                            onClick={handleClick}
                            selectedFiles={selectedFiles}
                            isMultiSelectMode={isMultiSelectMode}
                            onMark={handleMark}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                        />
                    )}
                </div>
            </div>
            <FileDetails onShare={handleShare} />
            <FileManagerDeleteDialog />
            <FileManagerInviteDialog />
            <FileManagerRenameDialog />
            <FileManagerCreateFolderDialog />
            <FileManagerUploadFolderDialog onRefresh={trigger} />
        </>
    )
}

export default FileManager
