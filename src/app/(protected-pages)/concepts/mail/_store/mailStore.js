import { create } from 'zustand'

const initialState = {
    mailList: [],
    mailListFetched: false,
    mail: {},
    selectedMailId: [],
    mobileSideBarExpand: false,
    selectedCategory: {},
    messageDialog: {
        mode: '',
        open: false,
    },
    pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
    },
    readIds: new Set(),
    readFingerprints: new Set(),
    flaggedIds: new Set(),
    starredIds: new Set(),
    deletedIds: new Set()
}

export const useMailStore = create((set) => ({
    ...initialState,
    setMailList: (payload) => set(() => ({ mailList: payload })),
    setMailListFetched: (payload) => set(() => ({ mailListFetched: payload })),
    setMail: (payload) => set(() => ({ mail: payload })),
    setSelectedMail: (payload) => set(() => ({ selectedMailId: payload })),
    setSelectedCategory: (payload) =>
        set(() => ({ selectedCategory: payload })),
    toggleMessageDialog: (payload) => set(() => ({ messageDialog: payload })),
    toggleMobileSidebar: (payload) =>
        set(() => ({ mobileSideBarExpand: payload })),
    setPagination: (payload) => set((state) => ({ 
        pagination: { ...state.pagination, ...payload } 
    })),
    setCurrentPage: (page) => set((state) => ({ 
        pagination: { ...state.pagination, currentPage: page } 
    })),
    setReadIds: (payload) => set(() => ({ readIds: payload })),
    setReadFingerprints: (payload) => set(() => ({ readFingerprints: payload })),
    markEmailAsRead: (mailId, fingerprint) => set((state) => {
        const newReadIds = new Set(state.readIds)
        const newReadFingerprints = new Set(state.readFingerprints)
        
        if (mailId) newReadIds.add(mailId)
        if (fingerprint) newReadFingerprints.add(fingerprint)
        
        return { 
            readIds: newReadIds, 
            readFingerprints: newReadFingerprints 
        }
    }),
    setFlaggedIds: (payload) => set(() => ({ flaggedIds: payload })),
    toggleEmailFlag: (mailId) => set((state) => {
        const newFlaggedIds = new Set(state.flaggedIds)
        
        if (newFlaggedIds.has(mailId)) {
            newFlaggedIds.delete(mailId)
        } else {
            newFlaggedIds.add(mailId)
        }
        
        // Persist to localStorage
        try {
            const flaggedArray = Array.from(newFlaggedIds)
            localStorage.setItem('mail_flagged_ids', JSON.stringify(flaggedArray))
        } catch (error) {
            console.error('Error saving flagged IDs to localStorage:', error)
        }
        
        return { flaggedIds: newFlaggedIds }
    }),
    setStarredIds: (payload) => set(() => ({ starredIds: payload })),
    toggleEmailStar: (mailId) => set((state) => {
        const newStarredIds = new Set(state.starredIds)
        
        if (newStarredIds.has(mailId)) {
            newStarredIds.delete(mailId)
        } else {
            newStarredIds.add(mailId)
        }
        
        // Persist to localStorage
        try {
            const starredArray = Array.from(newStarredIds)
            localStorage.setItem('mail_starred_ids', JSON.stringify(starredArray))
        } catch (error) {
            console.error('Error saving starred IDs to localStorage:', error)
        }
        
        return { starredIds: newStarredIds }
    }),
    setDeletedIds: (payload) => set(() => ({ deletedIds: payload })),
    deleteEmail: (mailId) => set((state) => {
        const newDeletedIds = new Set(state.deletedIds)
        newDeletedIds.add(mailId)
        
        // Persist to localStorage
        try {
            const deletedArray = Array.from(newDeletedIds)
            localStorage.setItem('mail_deleted_ids', JSON.stringify(deletedArray))
        } catch (error) {
            console.error('Error saving deleted IDs to localStorage:', error)
        }
        
        return { deletedIds: newDeletedIds }
    }),
    restoreEmail: (mailId) => set((state) => {
        const newDeletedIds = new Set(state.deletedIds)
        newDeletedIds.delete(mailId)
        
        // Persist to localStorage
        try {
            const deletedArray = Array.from(newDeletedIds)
            localStorage.setItem('mail_deleted_ids', JSON.stringify(deletedArray))
        } catch (error) {
            console.error('Error saving deleted IDs to localStorage:', error)
        }
        
        return { deletedIds: newDeletedIds }
    }),
    clearAllDeletedIds: () => set(() => {
        // Clear all deleted IDs from Zustand store
        try {
            localStorage.removeItem('mail_deleted_ids')
            console.log('Cleared all deleted IDs from Zustand store and localStorage')
        } catch (error) {
            console.error('Error clearing deleted IDs:', error)
        }
        
        return { deletedIds: new Set() }
    }),
}))
