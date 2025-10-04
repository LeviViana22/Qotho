'use client'
import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import { useTasksStore } from '../_store/tasksStore'
import { useScrumBoardStore } from '../../scrum-board/_store/scrumBoardStore'
import TicketContent from '../../scrum-board/_components/TicketContent'

const TaskDialog = () => {
    const {
        dialogOpen,
        closeDialog,
        dialogView,
        ticketId,
        board,
        updateColumns
    } = useTasksStore()

    const { 
        setSelectedTicketId, 
        setSelectedBoard,
        updateColumns: updateScrumBoardColumns
    } = useScrumBoardStore()

    // Sync the ticket ID and board with the scrum board store when dialog opens
    useEffect(() => {
        if (dialogOpen && dialogView === 'TICKET' && ticketId && board) {
            setSelectedTicketId(ticketId)
            setSelectedBoard(board)
        }
    }, [dialogOpen, dialogView, ticketId, board, setSelectedTicketId, setSelectedBoard])

    const handleTicketClose = () => {
        closeDialog()
        // Clear the scrum board store ticket selection to prevent auto-opening
        setSelectedTicketId('')
        setSelectedBoard('')
    }

    if (!dialogOpen || dialogView !== 'TICKET') return null

    return (
        <Dialog
            isOpen={dialogOpen}
            width={700}
            closable={true}
            onClose={handleTicketClose}
            onRequestClose={handleTicketClose}
        >
            <TicketContent 
                onTicketClose={handleTicketClose} 
                tasksUpdateColumns={updateColumns}
                scrumBoardUpdateColumns={updateScrumBoardColumns}
            />
        </Dialog>
    )
}

export default TaskDialog