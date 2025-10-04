import { create } from 'zustand'
import useUserStore from '@/stores/userStore'

const initialState = {
    columns: {},
    ordered: [],
    finalizedColumns: {
        'Canceladas': [],
        'Concluídas': []
    },
    finalizedOrdered: ['Canceladas', 'Concluídas'],
    boardMembers: [],
    allMembers: [],
    dialogOpen: false,
    dialogView: '',
    ticketId: '',
    board: '',
    currentView: 'em-andamento', // 'em-andamento' or 'finalizados'
    searchQuery: '',
    projectDetailsDrawerOpen: false,
    selectedProject: null,
    isLoading: true,
}

export const useScrumBoardStore = create((set, get) => ({
    ...initialState,
    updateOrdered: (payload) =>
        set(() => {
            return { ordered: payload }
        }),
    updateColumns: (payload) => set(() => ({ columns: payload })),
    updateFinalizedColumns: (payload) => set(() => ({ finalizedColumns: payload })),
    updateFinalizedOrdered: (payload) => set(() => ({ finalizedOrdered: payload })),
    updateBoardMembers: (payload) => {
        set(() => ({ boardMembers: payload }))
        // Also save to database
        get().saveBoardMembers(payload)
    },
    updateAllMembers: (payload) => set(() => ({ allMembers: payload })),
    forceUpdateMembers: (payload) => {
        set(() => ({ 
            allMembers: payload,
            boardMembers: payload 
        }))
    },
    setCurrentView: (payload) => set(() => ({ currentView: payload })),
    setSearchQuery: (payload) => set(() => ({ searchQuery: payload })),
    setIsLoading: (payload) => set(() => ({ isLoading: payload })),
    openDialog: () => set({ dialogOpen: true }),
    closeDialog: () =>
        set({
            dialogOpen: false,
        }),
    openProjectDetailsDrawer: (project) => set({ 
        projectDetailsDrawerOpen: true, 
        selectedProject: project 
    }),
    closeProjectDetailsDrawer: () => set({ 
        projectDetailsDrawerOpen: false, 
        selectedProject: null 
    }),
    resetView: () =>
        set({
            ticketId: '',
            board: '',
            dialogView: '',
        }),
    updateDialogView: (payload) => set(() => ({ dialogView: payload })),
    setSelectedTicketId: (payload) => set(() => ({ ticketId: payload })),
    setSelectedBoard: (payload) => set(() => ({ board: payload })),
    moveTicketToFinalized: async (project, sourceBoard, targetBoard, currentUser = null) => {
        // Note: Database update is now handled by the calling component
        // This function only handles UI state updates
        
        const ticketId = project.id || project.ticketId

        // Update UI state
        set((state) => {
            // Remove from source board
            const sourceColumns = { ...state.columns }
            const sourceColumn = sourceColumns[sourceBoard] || []
            const updatedSourceColumn = sourceColumn.filter(ticket => ticket.id !== ticketId)
            sourceColumns[sourceBoard] = updatedSourceColumn

            // Add to target finalized board
            const finalizedColumns = { ...state.finalizedColumns }
            const targetColumn = finalizedColumns[targetBoard] || []
            // Use the project data passed as parameter instead of finding it in source column
            if (project) {
                finalizedColumns[targetBoard] = [...targetColumn, project]
            }

            return {
                columns: sourceColumns,
                finalizedColumns: finalizedColumns,
                board: '' // Clear the board state since ticket is moved to finalized
            }
        })
    },
    // Restore ticket from finalized board back to regular board
    restoreTicketFromFinalized: async (project, sourceBoard, targetBoard, currentUser = null) => {
        // Note: Database update is now handled by the calling component
        // This function only handles UI state updates
        
        const ticketId = project.id || project.ticketId

        // Update UI state
        set((state) => {
            // Remove from source finalized board
            const finalizedColumns = { ...state.finalizedColumns }
            const sourceColumn = finalizedColumns[sourceBoard] || []
            const ticketToMove = sourceColumn.find(ticket => ticket.id === ticketId)
            const updatedSourceColumn = sourceColumn.filter(ticket => ticket.id !== ticketId)
            finalizedColumns[sourceBoard] = updatedSourceColumn

            // Add to target regular board
            const regularColumns = { ...state.columns }
            const targetColumn = regularColumns[targetBoard] || []
            // Use the project data passed as parameter instead of finding it in source column
            if (project) {
                regularColumns[targetBoard] = [...targetColumn, project]
            }

            return {
                columns: regularColumns,
                finalizedColumns: finalizedColumns,
                board: '' // Clear the board state since ticket is moved back to regular board
            }
        })
    },
    // Delete ticket completely from all boards
    deleteTicket: async (ticketId, currentUser = null) => {
        // First delete from database
        try {
            const response = await fetch(`/api/projects/${ticketId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete project from database');
            }
            
            console.log('Project deleted from database successfully');
        } catch (error) {
            console.error('Error deleting project from database:', error);
            // Don't update UI if database deletion failed
            return;
        }

        // Then update UI state
        set((state) => {
            // Remove from regular columns
            const regularColumns = { ...state.columns }
            Object.keys(regularColumns).forEach(boardName => {
                regularColumns[boardName] = regularColumns[boardName].filter(ticket => ticket.id !== ticketId)
            })

            // Remove from finalized columns
            const finalizedColumns = { ...state.finalizedColumns }
            Object.keys(finalizedColumns).forEach(boardName => {
                finalizedColumns[boardName] = finalizedColumns[boardName].filter(ticket => ticket.id !== ticketId)
            })

            return {
                columns: regularColumns,
                finalizedColumns: finalizedColumns,
                board: '' // Clear the board state since ticket is deleted
            }
        })
    },
    // Synchronize with tasks store
    syncWithTasks: (getTasksState) => {
        const tasksState = getTasksState()
        set({
            columns: tasksState.columns,
            ordered: tasksState.ordered,
            finalizedColumns: tasksState.finalizedColumns,
            finalizedOrdered: tasksState.finalizedOrdered,
            boardMembers: tasksState.boardMembers,
            allMembers: tasksState.allMembers,
            currentView: tasksState.currentView,
            searchQuery: tasksState.searchQuery,
        })
    },
    // Update tasks store with scrum board store data - versão direta sem setState
    updateTasks: () => {
        // Não podemos usar setTasksState diretamente
        // Esta função agora é um stub para compatibilidade
        console.log('updateTasks chamado, mas não pode atualizar diretamente')
    },
    
    // Load board members from database
    loadBoardMembers: async () => {
        try {
            const response = await fetch('/api/scrum-board/members')
            if (response.ok) {
                const data = await response.json()
                const dbMembers = data.members || []
                
                // Always update boardMembers with database data
                set({ boardMembers: dbMembers })
                console.log('Board members loaded from database:', dbMembers)
            } else {
                console.log('Scrum board members API not available, using empty array')
                // If API fails, just use empty array - real users will be loaded by useScrumBoardUsers
                set({ boardMembers: [] })
            }
        } catch (error) {
            console.error('Error loading board members from database:', error)
            // If API fails, just use empty array - real users will be loaded by useScrumBoardUsers
            set({ boardMembers: [] })
        }
    },
    
    // Save board members to database
    saveBoardMembers: async (members) => {
        try {
            const response = await fetch('/api/scrum-board/members', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ members }),
            })
            
            if (response.ok) {
                console.log('Board members saved to database:', members)
            } else {
                console.error('Failed to save board members to database')
            }
        } catch (error) {
            console.error('Error saving board members to database:', error)
        }
    },
    
    // Move project to finalized board (wrapper function)
    moveProjectToFinalized: async (project, targetBoard) => {
        const { moveTicketToFinalized } = get()
        const currentBoard = Object.keys(get().columns).find(boardName => 
            get().columns[boardName].some(p => p.id === project.id)
        )
        
        if (currentBoard) {
            await moveTicketToFinalized(project, currentBoard, targetBoard)
        }
    },
    
    // Move project back to regular board (wrapper function)
    moveProjectToRegular: async (project, targetBoard) => {
        const { restoreTicketFromFinalized } = get()
        const currentBoard = Object.keys(get().finalizedColumns).find(boardName => 
            get().finalizedColumns[boardName].some(p => p.id === project.id)
        )
        
        if (currentBoard) {
            await restoreTicketFromFinalized(project, currentBoard, targetBoard)
        }
    },
}))
