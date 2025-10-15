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
    deleteFile: async (fileId) => {
        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
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
            const response = await fetch(`/api/files/${payload.id}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
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
}))
