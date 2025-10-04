import { create } from 'zustand'

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
}

export const useTasksStore = create((set, get) => ({
    ...initialState,
    updateOrdered: (payload) =>
        set(() => {
            return { ordered: payload }
        }),
    updateColumns: (payload) => set(() => ({ columns: payload })),
    updateFinalizedColumns: (payload) => set(() => ({ finalizedColumns: payload })),
    updateFinalizedOrdered: (payload) => set(() => ({ finalizedOrdered: payload })),
    updateBoardMembers: (payload) => set(() => ({ boardMembers: payload })),
    updateAllMembers: (payload) => set(() => ({ allMembers: payload })),
    setCurrentView: (payload) => set(() => ({ currentView: payload })),
    setSearchQuery: (payload) => set(() => ({ searchQuery: payload })),
    openDialog: () => set({ dialogOpen: true }),
    closeDialog: () =>
        set({
            dialogOpen: false,
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
    moveTicketToFinalized: (ticketId, sourceBoard, targetBoard) => 
        set((state) => {
            // Remove from source board
            const sourceColumns = { ...state.columns }
            const sourceColumn = sourceColumns[sourceBoard] || []
            const updatedSourceColumn = sourceColumn.filter(ticket => ticket.id !== ticketId)
            sourceColumns[sourceBoard] = updatedSourceColumn

            // Add to target finalized board
            const finalizedColumns = { ...state.finalizedColumns }
            const targetColumn = finalizedColumns[targetBoard] || []
            const ticketToMove = sourceColumn.find(ticket => ticket.id === ticketId)
            if (ticketToMove) {
                // Add completedAt timestamp if moving to Concluídas
                const updatedTicket = targetBoard === 'Concluídas' 
                    ? { ...ticketToMove, completedAt: new Date().toISOString() }
                    : ticketToMove
                finalizedColumns[targetBoard] = [...targetColumn, updatedTicket]
            }

            // Save to localStorage
            localStorage.setItem('scrumboardData', JSON.stringify(sourceColumns))
            localStorage.setItem('finalizedData', JSON.stringify(finalizedColumns))

            // Dispatch events to notify other components
            window.dispatchEvent(new Event('scrumboardDataChanged'))
            window.dispatchEvent(new Event('finalizedDataChanged'))

            return {
                columns: sourceColumns,
                finalizedColumns: finalizedColumns
            }
        }),
    // Synchronize with scrum board store
    syncWithScrumBoard: (getScrumBoardState) => {
        const scrumBoardState = getScrumBoardState()
        set({
            columns: scrumBoardState.columns,
            ordered: scrumBoardState.ordered,
            finalizedColumns: scrumBoardState.finalizedColumns,
            finalizedOrdered: scrumBoardState.finalizedOrdered,
            boardMembers: scrumBoardState.boardMembers,
            allMembers: scrumBoardState.allMembers,
            currentView: scrumBoardState.currentView,
            searchQuery: scrumBoardState.searchQuery,
        })
    },
    // Update scrum board store with tasks store data - versão direta sem setState
    updateScrumBoard: () => {
        // Não podemos usar setScrumBoardState diretamente
        // Esta função agora é um stub para compatibilidade
        console.log('updateScrumBoard chamado, mas não pode atualizar diretamente')
    },
    // Load data from localStorage and sync
    loadFromLocalStorage: () => {
        try {
            const scrumboardData = localStorage.getItem('scrumboardData')
            const finalizedData = localStorage.getItem('finalizedData')
            
            if (scrumboardData) {
                const columns = JSON.parse(scrumboardData)
                set({ columns, ordered: Object.keys(columns) })
            }
            
            if (finalizedData) {
                const finalizedColumns = JSON.parse(finalizedData)
                set({ finalizedColumns })
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error)
        }
    },
}))
