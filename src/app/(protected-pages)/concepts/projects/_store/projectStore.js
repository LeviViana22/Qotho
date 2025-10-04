import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialState = {
    // Project data
    projectList: [],
    scrumBoardData: {},
    finalizedData: {},
    
    // User data
    allMembers: [],
    participantMembers: [],
    
    // UI state
    currentView: 'em-andamento',
    searchQuery: '',
    dialogOpen: false,
    dialogView: '',
    ticketId: '',
    board: '',
}

export const useProjectStore = create(
    persist(
        (set, get) => ({
            ...initialState,
            
            // Project management
            setProjectList: (payload) => set(() => ({ projectList: payload })),
            updateProjectList: (payload) =>
                set((state) => ({
                    projectList: [...state.projectList, ...[payload]],
                })),
            updateProjectFavorite: (payload) =>
                set((state) => {
                    const { id, value } = payload
                    const newList = state.projectList.map((project) => {
                        if (project.id === id) {
                            project.favourite = value
                        }
                        return project
                    })
                    return { projectList: [...newList] }
                }),
            
            // Scrum board management
            updateScrumBoardData: (payload) => set(() => ({ scrumBoardData: payload })),
            updateFinalizedData: (payload) => set(() => ({ finalizedData: payload })),
            
            // Update individual project in scrum board data
            updateProjectInScrumBoard: (projectId, projectData, boardName = null) => {
                set((state) => {
                    const newScrumBoardData = { ...state.scrumBoardData }
                    
                    // If boardName is provided, update only that board
                    if (boardName && newScrumBoardData[boardName]) {
                        const projectIndex = newScrumBoardData[boardName].findIndex(
                            p => p.id === projectId || p.projectId === projectId
                        )
                        if (projectIndex !== -1) {
                            newScrumBoardData[boardName][projectIndex] = {
                                ...newScrumBoardData[boardName][projectIndex],
                                ...projectData
                            }
                        }
                    } else {
                        // Update across all boards
                        Object.keys(newScrumBoardData).forEach(board => {
                            const projectIndex = newScrumBoardData[board].findIndex(
                                p => p.id === projectId || p.projectId === projectId
                            )
                            if (projectIndex !== -1) {
                                newScrumBoardData[board][projectIndex] = {
                                    ...newScrumBoardData[board][projectIndex],
                                    ...projectData
                                }
                            }
                        })
                    }
                    
                    return { scrumBoardData: newScrumBoardData }
                })
            },
            setCurrentView: (payload) => set(() => ({ currentView: payload })),
            setSearchQuery: (payload) => set(() => ({ searchQuery: payload })),
            
            // User management
            setAllMembers: (payload) => set(() => ({ allMembers: payload })),
            setParticipantMembers: (payload) => set(() => ({ participantMembers: payload })),
            updateMembers: (allMembers, participantMembers = null) => 
                set(() => ({ 
                    allMembers, 
                    participantMembers: participantMembers || allMembers 
                })),
            
            // Dialog management
            openDialog: () => set({ dialogOpen: true }),
            closeDialog: () => set({ dialogOpen: false }),
            updateDialogView: (payload) => set(() => ({ dialogView: payload })),
            setSelectedTicketId: (payload) => set(() => ({ ticketId: payload })),
            setSelectedBoard: (payload) => set(() => ({ board: payload })),
            resetView: () => set({ ticketId: '', board: '', dialogView: '' }),
            
            // Utility functions
            getMemberById: (id) => {
                const { allMembers } = get()
                return allMembers.find(member => member.id === id)
            },
            getMembersForSelect: () => {
                const { allMembers } = get()
                return allMembers.map((member) => ({
                    value: member.id,
                    label: member.name,
                    img: member.img,
                }))
            },
            
            // Sync with external stores
            syncWithUserStore: (users) => {
                if (users && users.length > 0) {
                    set({ allMembers: users })
                    // You can add logic here to determine participant members
                    // For now, we'll use all users as participants
                    set({ participantMembers: users })
                }
            },
        }),
        {
            name: 'project-store',
            partialize: (state) => ({
                projectList: state.projectList,
                scrumBoardData: state.scrumBoardData,
                finalizedData: state.finalizedData,
                allMembers: state.allMembers,
                participantMembers: state.participantMembers,
            }),
        }
    )
)
