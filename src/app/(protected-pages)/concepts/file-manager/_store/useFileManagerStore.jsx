import { create } from 'zustand'

const initialState = {
    fileList: [],
    layout: 'grid',
    selectedFile: '',
    openedDirectoryId: '',
    directories: [],
    deleteDialog: { open: false, id: '' },
    inviteDialog: { open: false, id: '' },
    renameDialog: { open: false, id: '' },
    createFolderDialog: { open: false },
    uploadFolderDialog: { open: false, files: [] },
    selectedFiles: [], // Array of selected file IDs
    isMultiSelectMode: false, // Whether we're in multi-select mode
}

export const useFileManagerStore = create((set, get) => ({
    ...initialState,
    setFileList: (payload) => set(() => ({ fileList: payload })),
    setLayout: (payload) => set(() => ({ layout: payload })),
    setOpenedDirectoryId: (payload) =>
        set(() => ({ openedDirectoryId: payload })),
    setSelectedFile: (payload) => set(() => ({ selectedFile: payload })),
    setDirectories: (payload) => set(() => ({ directories: payload })),
    setDeleteDialog: (payload) => set(() => ({ deleteDialog: payload })),
    setInviteDialog: (payload) => set(() => ({ inviteDialog: payload })),
    setRenameDialog: (payload) => set(() => ({ renameDialog: payload })),
    setCreateFolderDialog: (payload) => set(() => ({ createFolderDialog: payload })),
    setUploadFolderDialog: (payload) => set(() => ({ uploadFolderDialog: payload })),
    setSelectedFiles: (payload) => set(() => ({ selectedFiles: payload })),
    setIsMultiSelectMode: (payload) => set(() => ({ isMultiSelectMode: payload })),
    deleteFile: async (fileId) => {
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': authHeader
                }
            })
            
            if (response.ok) {
                set(() => ({
                    fileList: get().fileList.filter((file) => file.id !== fileId),
                }))
            } else {
                throw new Error('Failed to delete file')
            }
        } catch (error) {
            console.error('Error deleting file:', error)
            throw error
        }
    },
    renameFile: async (payload) => {
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch(`/api/files/${payload.id}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ name: payload.fileName }),
            })
            
            if (response.ok) {
                set(() => ({
                    fileList: get().fileList.map((file) => {
                        if (file.id === payload.id) {
                            return { ...file, name: payload.fileName }
                        }
                        return file
                    }),
                }))
            } else {
                throw new Error('Failed to rename file')
            }
        } catch (error) {
            console.error('Error renaming file:', error)
            throw error
        }
    },
    createFolder: async (folderName) => {
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch('/api/files/folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ 
                    name: folderName,
                    parentId: get().openedDirectoryId || 'root'
                })
            })
            
            if (response.ok) {
                const result = await response.json()
                // Add the new folder to the file list
                set(() => ({
                    fileList: [...get().fileList, {
                        id: result.folder.id,
                        name: result.folder.name,
                        fileType: 'directory',
                        size: 0,
                        createdTime: result.folder.createdTime,
                        webViewLink: result.folder.webViewLink
                    }]
                }))
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to create folder')
            }
        } catch (error) {
            console.error('Error creating folder:', error)
            throw error
        }
    },
    uploadFolder: async (files) => {
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }

            // Create FormData for folder upload
            const formData = new FormData()
            console.log('Uploading folder with files:', files.length)
            
            // Preserve webkitRelativePath information
            const filePaths = []
            files.forEach((file, index) => {
                console.log(`File ${index}:`, file.name, file.size, file.type, file.webkitRelativePath)
                formData.append('file', file)
                filePaths.push({
                    name: file.name,
                    webkitRelativePath: file.webkitRelativePath
                })
            })
            
            formData.append('parentId', get().openedDirectoryId || 'root')
            formData.append('isFolderUpload', 'true')
            formData.append('filePaths', JSON.stringify(filePaths))

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader
                },
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                console.log('Folder uploaded successfully:', result)
                return result
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to upload folder')
            }
        } catch (error) {
            console.error('Error uploading folder:', error)
            throw error
        }
    },
    // Multi-selection methods
    toggleFileSelection: (fileId) => {
        const { selectedFiles } = get()
        const isSelected = selectedFiles.includes(fileId)
        
        if (isSelected) {
            // Remove from selection
            const newSelection = selectedFiles.filter(id => id !== fileId)
            set(() => ({ 
                selectedFiles: newSelection,
                isMultiSelectMode: newSelection.length > 0
            }))
        } else {
            // Add to selection
            set(() => ({ 
                selectedFiles: [...selectedFiles, fileId],
                isMultiSelectMode: true
            }))
        }
    },
    clearSelection: () => {
        set(() => ({ 
            selectedFiles: [],
            isMultiSelectMode: false
        }))
    },
    // Move files method
    moveFiles: async (fileIds, targetFolderId) => {
        try {
            // Get auth header for the request
            const { getAuthHeader } = await import('@/lib/googleDriveAuth')
            const authHeader = getAuthHeader()
            
            if (!authHeader) {
                throw new Error('No Google Drive access token available')
            }
            
            const response = await fetch('/api/files/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ 
                    fileIds: fileIds,
                    targetFolderId: targetFolderId
                })
            })
            
            if (response.ok) {
                const result = await response.json()
                console.log('Files moved successfully:', result)
                
                // Clear selection after successful move
                get().clearSelection()
                
                return result
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to move files')
            }
        } catch (error) {
            console.error('Error moving files:', error)
            throw error
        }
    },
}))
