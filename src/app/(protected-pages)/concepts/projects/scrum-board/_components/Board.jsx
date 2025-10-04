'use client'
import { lazy, Suspense, useState, useRef, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Spinner from '@/components/ui/Spinner'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import reorderDragable from '@/utils/reorderDragable'
import BoardColumn from './BoardColumn'
import ScrumBoardHeader from './ScrumBoardHeader'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useTasksStore } from '../../tasks/_store/tasksStore'
import useUserStore from '@/stores/userStore'
import sleep from '@/utils/sleep'
import reoderArray from '@/utils/reoderArray'
import { Droppable, DragDropContext } from '@hello-pangea/dnd'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'

const TicketContent = lazy(() => import('./TicketContent'))
const AddNewTicketContent = lazy(() => import('./AddNewTicketContent'))
const AddNewMemberContent = lazy(() => import('./AddNewMemberContent'))
const AddNewColumnContent = lazy(() => import('./AddNewColumnContent'))
const ProjectDetailsDrawer = lazy(() => import('./ProjectDetailsDrawer'))

const Board = (props) => {
    const {
        columns,
        ordered,
        finalizedColumns,
        finalizedOrdered,
        currentView,
        searchQuery,
        boardMembers,
        updateOrdered,
        updateColumns,
        updateFinalizedColumns,
        updateFinalizedOrdered,
        closeDialog,
        resetView,
        dialogView,
        dialogOpen,
        syncWithTasks,
        updateTasks,
        projectDetailsDrawerOpen,
        selectedProject,
        closeProjectDetailsDrawer,
        isLoading
    } = useScrumBoardStore()

    const tasksStore = useTasksStore()

    const {
        containerHeight,
        useClone,
        isCombineEnabled,
        withScrollableColumns,
    } = props

    const [showLeftArrow, setShowLeftArrow] = useState(true)
    const [showRightArrow, setShowRightArrow] = useState(true)
    const [isLeftHovering, setIsLeftHovering] = useState(false)
    const [isRightHovering, setIsRightHovering] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const scrollContainerRef = useRef(null)

    // Atualizar diretamente o tasksStore quando o scrumBoardStore muda
    // Usamos um ref para evitar atualizações desnecessárias
    const prevValuesRef = useRef({
        columns: {},
        ordered: [],
        finalizedColumns: {},
        finalizedOrdered: [],
        currentView: '',
        searchQuery: ''
    })
    
    useEffect(() => {
        // Verificar se os valores realmente mudaram para evitar atualizações desnecessárias
        if (!tasksStore) return;
        
        const prevValues = prevValuesRef.current;
        const columnsChanged = JSON.stringify(prevValues.columns) !== JSON.stringify(columns);
        const orderedChanged = JSON.stringify(prevValues.ordered) !== JSON.stringify(ordered);
        const finalizedColumnsChanged = JSON.stringify(prevValues.finalizedColumns) !== JSON.stringify(finalizedColumns);
        const finalizedOrderedChanged = JSON.stringify(prevValues.finalizedOrdered) !== JSON.stringify(finalizedOrdered);
        const currentViewChanged = prevValues.currentView !== currentView;
        const searchQueryChanged = prevValues.searchQuery !== searchQuery;
        
        const hasChanges = columnsChanged || orderedChanged || finalizedColumnsChanged || 
                          finalizedOrderedChanged || currentViewChanged || searchQueryChanged;
        
        if (hasChanges) {
            // Atualizar diretamente o tasksStore apenas se algo mudou
            if (columnsChanged) tasksStore.updateColumns(columns);
            if (orderedChanged) tasksStore.updateOrdered(ordered);
            if (finalizedColumnsChanged) tasksStore.updateFinalizedColumns(finalizedColumns);
            if (finalizedOrderedChanged) tasksStore.updateFinalizedOrdered(finalizedOrdered);
            if (currentViewChanged) tasksStore.setCurrentView(currentView);
            if (searchQueryChanged) tasksStore.setSearchQuery(searchQuery);
            
            // Atualizar os valores de referência
            prevValuesRef.current = {
                columns,
                ordered,
                finalizedColumns,
                finalizedOrdered,
                currentView,
                searchQuery
            }
        }
    }, [columns, ordered, finalizedColumns, finalizedOrdered, currentView, searchQuery, tasksStore])


    const onDialogClose = async () => {
        closeDialog()
        await sleep(200)
        resetView()
    }

    const onDragStart = (result) => {
        // Only show trash can when dragging cards, not columns
        if (result.type === 'CARD') {
            setIsDragging(true)
        }
    }

    const onDragEnd = async (result) => {
        setIsDragging(false)
        
        // Handle dropping into trash can
        if (result.destination && result.destination.droppableId === 'trash-can') {
            const currentColumns = currentView === 'em-andamento' ? columns : finalizedColumns
            const sourceColumn = currentColumns[result.source.droppableId]
            const [removedCard] = sourceColumn.splice(result.source.index, 1)
            
            const newColumns = {
                ...currentColumns,
                [result.source.droppableId]: sourceColumn,
            }
            
            if (currentView === 'em-andamento') {
                updateColumns(newColumns)
                
                // Save individual project deletion to backend
                try {
                    const response = await fetch(`/api/projects/${removedCard.id}`, {
                        method: 'DELETE',
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to delete project from database');
                    }
                    
                    console.log('Card deletion saved to backend successfully');
                } catch (error) {
                    console.error('Error saving card deletion to backend:', error);
                }
            } else {
                updateFinalizedColumns(newColumns)
                
                // Also delete from database for finalized boards
                try {
                    const response = await fetch(`/api/projects/${removedCard.id}`, {
                        method: 'DELETE',
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to delete project from database');
                    }
                    
                    console.log('Finalized card deletion saved to backend successfully');
                } catch (error) {
                    console.error('Error saving finalized card deletion to backend:', error);
                }
            }
            
            return
        }
        if (result.combine) {
            if (result.type === 'COLUMN') {
                const currentOrdered = currentView === 'em-andamento' ? ordered : finalizedOrdered
                const shallow = [...currentOrdered]
                shallow.splice(result.source.index, 1)
                if (currentView === 'em-andamento') {
                    updateOrdered(shallow)
                } else {
                    updateFinalizedOrdered(shallow)
                }
                return
            }

            const currentColumns = currentView === 'em-andamento' ? columns : finalizedColumns
            const column = currentColumns[result.source.droppableId]
            const withQuoteRemoved = [...column]
            withQuoteRemoved.splice(result.source.index, 1)
            const newColumns = {
                ...currentColumns,
                [result.source.droppableId]: withQuoteRemoved,
            }
            if (currentView === 'em-andamento') {
                updateColumns(newColumns)
                
                // Note: Column combine is a UI operation, no database save needed
                console.log('Column combine completed (UI state only)');
            } else {
                updateFinalizedColumns(newColumns)
            }
            return
        }

        if (!result.destination) {
            return
        }

        const source = result.source
        const destination = result.destination

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return
        }

        if (result.type === 'COLUMN') {
            if (currentView === 'em-andamento') {
                // For em-andamento view, we need to work with the filtered ordered array
                const filteredOrdered = ordered.filter(key => key && key !== 'undefined' && key !== 'Concluídas' && key !== 'Canceladas')
                
                const newFilteredOrdered = reoderArray(
                    filteredOrdered,
                    source.index,
                    destination.index,
                )
                
                // Reconstruct the full ordered array with the new order
                const finalizedBoards = ['Concluídas', 'Canceladas']
                const newOrdered = [...newFilteredOrdered, ...finalizedBoards]
                
                updateOrdered(newOrdered)
                
                // Save board order to database (only the active boards, not finalized ones)
                try {
                    const response = await fetch('/api/projects/scrum-board/reorder-boards', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ boardOrder: newFilteredOrdered }),
                    })
                    
                    if (!response.ok) {
                        console.error('Failed to save board order to database')
                        // Optionally revert the UI change if database save fails
                    } else {
                        console.log('Board order saved to database successfully')
                    }
                } catch (error) {
                    console.error('Error saving board order to database:', error)
                }
            } else {
                // For finalized view, work with finalizedOrdered directly
                const newOrdered = reoderArray(
                    finalizedOrdered,
                    source.index,
                    destination.index,
                )
                updateFinalizedOrdered(newOrdered)
            }
            return
        }

        const currentColumns = currentView === 'em-andamento' ? columns : finalizedColumns
        const data = reorderDragable({
            quoteMap: currentColumns,
            source,
            destination,
        })

        if (currentView === 'em-andamento') {
            // Check if this is a status change (moving between different boards)
            if (source.droppableId !== destination.droppableId) {
                // Find the moved card to get its data
                const movedCard = currentColumns[source.droppableId][source.index];
                if (movedCard) {
                    // Add activity entry for status change
                    const { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } = await import('@/utils/activityUtils');
                    
                    // Get current user for activity logging
                    const currentUser = useUserStore.getState().currentUser;
                    
                    const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_STATUS, {
                        projectId: movedCard.projectId || movedCard.id,
                        ticket: movedCard.projectId || movedCard.id,
                        oldStatus: source.droppableId,
                        newStatus: destination.droppableId,
                    }, currentUser);
                    
                    const updatedCard = addActivityToProject(movedCard, activityEntry);
                    
                    // Update the card's status to reflect the new board
                    updatedCard.status = destination.droppableId;
                    
                    // Update the card in the new destination with the activity
                    const updatedQuoteMap = { ...data.quoteMap };
                    const destinationColumn = updatedQuoteMap[destination.droppableId];
                    if (destinationColumn && destinationColumn[destination.index]) {
                        destinationColumn[destination.index] = updatedCard;
                    }
                    
                    updateColumns(updatedQuoteMap);
                    
                    // Save individual project to backend
                    try {
                        const response = await fetch(`/api/projects/${movedCard.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(updatedCard)
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to save project to database');
                        }
                        
                        console.log('Card drag with activity saved to backend successfully');
                    } catch (error) {
                        console.error('Error saving card drag to backend:', error);
                    }
                } else {
                    // Fallback if card not found - just update UI state
                    updateColumns(data.quoteMap);
                    console.log('Card drag completed (fallback - UI state only)');
                }
            } else {
                // Same board reordering - no status change, just UI state
                updateColumns(data.quoteMap);
                console.log('Same board reordering completed (UI state only)');
            }
        } else {
            // Handle finalized boards (Concluídas and Canceladas)
            updateFinalizedColumns(data.quoteMap)
            // Note: Finalized boards use Zustand state management only
        }
    }

    const checkScrollPosition = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            // Always show arrows, but disable functionality when not needed
            setShowLeftArrow(true)
            setShowRightArrow(true)
        }
    }

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -288, behavior: 'smooth' })
        }
    }

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 288, behavior: 'smooth' })
        }
    }

    const handleLeftArrowHover = () => {
        setIsLeftHovering(true)
    }

    const handleLeftArrowLeave = () => {
        setIsLeftHovering(false)
    }

    const handleRightArrowHover = () => {
        setIsRightHovering(true)
    }

    const handleRightArrowLeave = () => {
        setIsRightHovering(false)
    }

    useEffect(() => {
        checkScrollPosition()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkScrollPosition)
            return () => container.removeEventListener('scroll', checkScrollPosition)
        }
    }, [])

    const filterCards = (cards) => {
        // Safety check: ensure cards is an array
        if (!Array.isArray(cards)) {
            console.warn('filterCards: cards is not an array:', cards, 'type:', typeof cards)
            // Try to convert to array if it's an object
            if (cards && typeof cards === 'object') {
                return Object.values(cards).filter(item => item && typeof item === 'object')
            }
            return []
        }
        
        // First, filter out any cards without IDs
        const validCards = cards.filter(card => card && card.id);
        
        if (!searchQuery.trim()) return validCards
        
        return validCards.filter(card => {
            const searchLower = searchQuery.toLowerCase()
            
            // Search in all card fields
            return Object.values(card).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchLower)
                }
                if (typeof value === 'number') {
                    return value.toString().includes(searchQuery)
                }
                if (Array.isArray(value)) {
                    return value.some(item => {
                        if (typeof item === 'string') {
                            return item.toLowerCase().includes(searchLower)
                        }
                        if (typeof item === 'object' && item.name) {
                            return item.name.toLowerCase().includes(searchLower)
                        }
                        return false
                    })
                }
                return false
            })
        })
    }

    useEffect(() => {
        if (isLeftHovering && scrollContainerRef.current) {
            const interval = setInterval(() => {
                if (scrollContainerRef.current && isLeftHovering) {
                    const { scrollLeft } = scrollContainerRef.current
                    if (scrollLeft > 0) {
                        scrollContainerRef.current.scrollBy({ left: -10, behavior: 'auto' })
                    } else {
                        setIsLeftHovering(false)
                    }
                }
            }, 16)
            return () => clearInterval(interval)
        }
    }, [isLeftHovering])

    useEffect(() => {
        if (isRightHovering && scrollContainerRef.current) {
            const interval = setInterval(() => {
                if (scrollContainerRef.current && isRightHovering) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
                    if (scrollLeft < scrollWidth - clientWidth - 1) {
                        scrollContainerRef.current.scrollBy({ left: 10, behavior: 'auto' })
                    } else {
                        setIsRightHovering(false)
                    }
                }
            }, 16)
            return () => clearInterval(interval)
        }
    }, [isRightHovering])

    // Show loading spinner while data is being loaded
    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Spinner size="3.25rem" />
            </div>
        )
    }

    return (
        <>
            <AdaptiveCard className="h-full w-full" bodyClass="h-full flex flex-col w-full">
                <ScrumBoardHeader />
                <DragDropContext 
                    onDragStart={(result) => onDragStart(result)}
                    onDragEnd={(result) => onDragEnd(result)}
                >
                    <Droppable
                        droppableId="board"
                        type="COLUMN"
                        direction="horizontal"
                        ignoreContainerClipping={containerHeight}
                        isCombineEnabled={isCombineEnabled}
                    >
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                className="scrumboard flex flex-col flex-auto w-full mb-2 relative"
                                {...provided.droppableProps}
                                suppressHydrationWarning
                            >
                                <div 
                                    ref={scrollContainerRef}
                                    className="scrumboard-body flex overflow-x-auto h-full mt-4 gap-6 scrollbar-hide px-2"
                                >
                                    {currentView === 'em-andamento' ? (
                                        <>
                                            {ordered.filter(key => key && key !== 'undefined' && key !== 'Concluídas' && key !== 'Canceladas').map((key, index) => (
                                                <BoardColumn
                                                    key={key}
                                                    index={index}
                                                    title={key}
                                                    contents={filterCards(Array.isArray(columns[key]) ? columns[key] : [])}
                                                    isScrollable={withScrollableColumns}
                                                    isCombineEnabled={isCombineEnabled}
                                                    useClone={useClone}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {finalizedOrdered.filter(key => key && key !== 'undefined').map((key, index) => (
                                                <BoardColumn
                                                    key={key}
                                                    index={index}
                                                    title={key}
                                                    contents={filterCards(Array.isArray(finalizedColumns[key]) ? finalizedColumns[key] : [])}
                                                    isScrollable={withScrollableColumns}
                                                    isCombineEnabled={isCombineEnabled}
                                                    useClone={useClone}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {provided.placeholder}
                                </div>
                                
                                {/* Left scroll arrow */}
                                <div
                                    onMouseEnter={handleLeftArrowHover}
                                    onMouseLeave={handleLeftArrowLeave}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer opacity-0 hover:opacity-100"
                                    aria-label="Scroll left"
                                >
                                    <TbChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                                
                                {/* Right scroll arrow */}
                                <div
                                    onMouseEnter={handleRightArrowHover}
                                    onMouseLeave={handleRightArrowLeave}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer opacity-0 hover:opacity-100"
                                    aria-label="Scroll right"
                                >
                                    <TbChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </AdaptiveCard>
            <Dialog
                isOpen={dialogOpen}
                width={dialogView === 'TICKET' || dialogView === 'NEW_TICKET' ? 700 : 520}
                closable={dialogView !== 'TICKET'}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <Suspense
                    fallback={
                        <div className="my-4 text-center">
                            <Spinner />
                        </div>
                    }
                >
                    {dialogView === 'TICKET' && (
                        <TicketContent 
                            onTicketClose={onDialogClose} 
                            scrumBoardUpdateColumns={updateColumns}
                            tasksUpdateColumns={tasksStore.updateColumns}
                        />
                    )}
                    {dialogView === 'NEW_TICKET' && <AddNewTicketContent />}
                    {dialogView === 'NEW_COLUMN' && <AddNewColumnContent />}
                    {dialogView === 'ADD_MEMBER' && <AddNewMemberContent />}
                </Suspense>
            </Dialog>
            
            {/* Project Details Drawer */}
            <Suspense
                fallback={
                    <div className="my-4 text-center">
                        <Spinner />
                    </div>
                }
            >
                <ProjectDetailsDrawer
                    isOpen={projectDetailsDrawerOpen}
                    onClose={closeProjectDetailsDrawer}
                    projectData={selectedProject}
                />
            </Suspense>
        </>
    )
}

export default Board
