'use client'
import { useState, useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Table from '@/components/ui/Table'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Slider from '@/components/ui/Slider'
import { useTasksStore } from '../_store/tasksStore'
import { useScrumBoardStore } from '../../scrum-board/_store/scrumBoardStore'
import AddTask from './AddTask'
import { MdDragIndicator } from 'react-icons/md'
import { TbExternalLink } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import TrashCan from '../../scrum-board/_components/TrashCan'

const TaskList = ({ columnWidths = {} }) => {
    const {
        columns,
        ordered,
        finalizedColumns,
        finalizedOrdered,
        currentView,
        searchQuery,
        updateColumns,
        updateOrdered,
        updateFinalizedColumns,
        updateFinalizedOrdered,
        openDialog,
        setSelectedTicketId,
        setSelectedBoard,
        updateDialogView
    } = useTasksStore()

    const { syncWithScrumBoard, updateScrumBoard } = useTasksStore()
    const scrumBoardStore = useScrumBoardStore()
    const router = useRouter()

    const [selectedCreateTaskButton, setSelectedCreateTaskButton] = useState('')
    const [isDragging, setIsDragging] = useState(false)

    const handleExternalLinkClick = (e, projectId) => {
        e.stopPropagation() // Prevent row click
        if (projectId) {
            router.push(`/concepts/projects/tasks/${projectId}`)
        }
    }

    // Synchronize with scrum board store on mount and when data changes
    useEffect(() => {
        // Get the current state from the scrum board store
        const scrumBoardState = useScrumBoardStore.getState()
        if (scrumBoardState && Object.keys(scrumBoardState.columns || {}).length > 0) {
            syncWithScrumBoard(() => scrumBoardState)
        }
    }, [syncWithScrumBoard])

    // Atualizar diretamente o scrumBoardStore quando o tasksStore muda
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
        if (!scrumBoardStore || Object.keys(columns).length === 0) return;
        
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
            // Atualizar diretamente o scrumBoardStore apenas se algo mudou
            if (columnsChanged) scrumBoardStore.updateColumns(columns);
            if (orderedChanged) scrumBoardStore.updateOrdered(ordered);
            if (finalizedColumnsChanged) scrumBoardStore.updateFinalizedColumns(finalizedColumns);
            if (finalizedOrderedChanged) scrumBoardStore.updateFinalizedOrdered(finalizedOrdered);
            if (currentViewChanged) scrumBoardStore.setCurrentView(currentView);
            if (searchQueryChanged) scrumBoardStore.setSearchQuery(searchQuery);
            
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
    }, [columns, ordered, finalizedColumns, finalizedOrdered, currentView, searchQuery, scrumBoardStore])

    // Listen for scrumboardDataChanged events to sync with localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    const newData = JSON.parse(storedData);
                    updateColumns(newData);
                    updateOrdered(Object.keys(newData));
                    console.log('Tasks view updated from localStorage event');
                }
            } catch (error) {
                console.error('Error updating tasks view from localStorage event:', error);
            }
        };

        window.addEventListener('scrumboardDataChanged', handleStorageChange);
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleStorageChange);
        };
    }, [updateColumns, updateOrdered]);

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
                
                // Save to localStorage for persistence
                localStorage.setItem('scrumboardData', JSON.stringify(newColumns));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('scrumboardDataChanged'));
                
                // Save to backend
                try {
                    const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                    await ProjectDataService.saveScrumboardData(newColumns);
                    console.log('Card deletion saved to backend successfully');
                } catch (error) {
                    console.error('Error saving card deletion to backend:', error);
                }
            } else {
                updateFinalizedColumns(newColumns)
                
                // Save to localStorage for persistence
                localStorage.setItem('finalizedData', JSON.stringify(newColumns));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('finalizedDataChanged'));
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
            const currentOrdered = currentView === 'em-andamento' ? ordered : finalizedOrdered
            const newOrdered = [...currentOrdered]
            const [removed] = newOrdered.splice(source.index, 1)
            newOrdered.splice(destination.index, 0, removed)
            
            if (currentView === 'em-andamento') {
                updateOrdered(newOrdered)
            } else {
                // Handle finalized columns reordering if needed
            }
            return
        }

        // Handle task reordering within columns
        const currentColumns = currentView === 'em-andamento' ? columns : finalizedColumns
        const sourceColumn = currentColumns[source.droppableId] || []
        const destColumn = currentColumns[destination.droppableId] || []
        
        const [movedTask] = sourceColumn.splice(source.index, 1)
        
        let newColumns = {}
        
        if (source.droppableId === destination.droppableId) {
            sourceColumn.splice(destination.index, 0, movedTask)
            newColumns = { ...currentColumns, [source.droppableId]: sourceColumn }
        } else {
            destColumn.splice(destination.index, 0, movedTask)
            newColumns = { 
                ...currentColumns, 
                [source.droppableId]: sourceColumn,
                [destination.droppableId]: destColumn
            }
        }
        
        if (currentView === 'em-andamento') {
            // Check if this is a status change (moving between different boards)
            if (source.droppableId !== destination.droppableId) {
                // Add activity entry for status change
                const { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } = await import('@/utils/activityUtils');
                
                const activityEntry = createActivityEntry(ACTIVITY_TYPES.UPDATE_STATUS, {
                    projectId: movedTask.projectId || movedTask.id,
                    ticket: movedTask.projectId || movedTask.id,
                    oldStatus: source.droppableId,
                    newStatus: destination.droppableId,
                });
                
                const updatedTask = addActivityToProject(movedTask, activityEntry);
                
                // Update the task in the new destination with the activity
                const updatedColumns = { ...newColumns };
                const destinationColumn = updatedColumns[destination.droppableId];
                if (destinationColumn && destinationColumn[destination.index]) {
                    destinationColumn[destination.index] = updatedTask;
                }
                
                updateColumns(updatedColumns);
                
                // Save to localStorage for persistence
                localStorage.setItem('scrumboardData', JSON.stringify(updatedColumns));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('scrumboardDataChanged'));
                
                // Save to backend
                try {
                    const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                    await ProjectDataService.saveScrumboardData(updatedColumns);
                    console.log('Task moved with activity and saved to backend successfully');
                } catch (error) {
                    console.error('Error saving task move to backend:', error);
                }
            } else {
                // Same board reordering - no status change
                updateColumns(newColumns);
                
                // Save to localStorage for persistence
                localStorage.setItem('scrumboardData', JSON.stringify(newColumns));
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('scrumboardDataChanged'));
                
                // Save to backend
                try {
                    const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                    await ProjectDataService.saveScrumboardData(newColumns);
                    console.log('Task moved and saved to backend successfully');
                } catch (error) {
                    console.error('Error saving task move to backend:', error);
                }
            }
        } else {
            // Handle finalized columns update
            updateFinalizedColumns(newColumns);
            
            // Save to localStorage for persistence
            localStorage.setItem('finalizedData', JSON.stringify(newColumns));
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event('finalizedDataChanged'));
        }
    }

    const handleCreateTask = async (key, task) => {
        const newData = { ...columns }
        if (!newData[key]) {
            newData[key] = []
        }
        newData[key].push(task)
        updateColumns(newData)
        setSelectedCreateTaskButton('')
        
        // Save to localStorage for persistence
        localStorage.setItem('scrumboardData', JSON.stringify(newData));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('scrumboardDataChanged'));
        
        // Save to backend
        try {
            const ProjectDataService = (await import('@/services/ProjectDataService')).default;
            await ProjectDataService.saveScrumboardData(newData);
            console.log('Task created and saved to backend successfully');
        } catch (error) {
            console.error('Error saving task creation to backend:', error);
        }
    }

    const handleTaskClick = (task, boardName) => {
        setSelectedTicketId(task.id)
        setSelectedBoard(boardName)
        updateDialogView('TICKET')
        openDialog()
    }

    const getCurrentData = () => {
        if (currentView === 'em-andamento') {
            // Filter out finalized boards from em-andamento view
            const filteredOrdered = ordered.filter(board => 
                board !== 'Concluídas' && board !== 'Canceladas'
            )
            const filteredColumns = {}
            filteredOrdered.forEach(board => {
                if (columns[board]) {
                    filteredColumns[board] = columns[board]
                }
            })
            return { ordered: filteredOrdered, columns: filteredColumns }
        } else {
            return { ordered: finalizedOrdered, columns: finalizedColumns }
        }
    }

    const { ordered: currentOrdered, columns: currentColumns } = getCurrentData()

    const filterCards = (cards) => {
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

    if (currentOrdered.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl text-gray-400 mb-4">📋</div>
                    <p className="text-gray-500">Carregando projetos...</p>
                </div>
            </div>
        )
    }

    return (
                        <DragDropContext 
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                >
            <div className="space-y-8">
                {currentOrdered.map((boardKey) => {
                    const boardTasks = filterCards(currentColumns[boardKey] || [])
                    
                    return (
                        <div key={boardKey} className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {boardKey}
                            </h3>
                            
                            <Droppable droppableId={boardKey} type="CONTENT">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        className="overflow-x-auto"
                                        {...provided.droppableProps}
                                    >
                                        <Table className="w-full">
                                            <Table.THead>
                                                <Table.Tr>
                                                    <Table.Th className="w-[60px]">Ações</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Nome do Projeto'] }}>Nome do Projeto</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Atendente'] }}>Atendente</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Data de Entrada'] }}>Data de Entrada</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Tipo'] }}>Tipo</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['E-protocolo'] }}>E-protocolo</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Custas'] }}>Custas</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Vencimento Matrícula'] }}>Vencimento Matrícula</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Ordem'] }}>Ordem</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Unidade'] }}>Unidade</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Natureza'] }}>Natureza</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Código de Validação ITBI'] }}>Código de Validação ITBI</Table.Th>
                                                    <Table.Th style={{ width: columnWidths['Envio ITBI/Escritura'] }}>Envio ITBI/Escritura</Table.Th>
                                                                                <Table.Th style={{ width: columnWidths['ITBI Pago?'] }}>ITBI Pago?</Table.Th>
                            <Table.Th style={{ width: columnWidths['Escritura Pago?'] }}>Escritura Pago?</Table.Th>
                            <Table.Th style={{ width: columnWidths['Envio Minuta'] }}>Envio Minuta</Table.Th>
                            <Table.Th style={{ width: columnWidths['Minuta Aprovada?'] }}>Minuta Aprovada?</Table.Th>
                            <Table.Th style={{ width: columnWidths['Data Lavratura'] }}>Data Lavratura</Table.Th>
                            <Table.Th style={{ width: columnWidths['Data Envio para Registro'] }}>Data Envio para Registro</Table.Th>
                            <Table.Th style={{ width: columnWidths['Status ONR'] }}>Status ONR</Table.Th>
                            <Table.Th style={{ width: columnWidths['Pendências'] }}>Pendências</Table.Th>
                                                </Table.Tr>
                                            </Table.THead>
                                            <Table.TBody>
                                                {boardTasks.map((task, index) => {
                                                    // Ensure task has an id, if not, skip rendering
                                                    if (!task || !task.id) {
                                                        console.warn('TaskList: Task missing id property:', task);
                                                        return null;
                                                    }
                                                    
                                                    return (
                                                        <Draggable
                                                            key={task.id}
                                                            draggableId={task.id}
                                                            index={index}
                                                            type="CARD"
                                                        >
                                                        {(provided) => (
                                                            <Table.Tr
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                onClick={() => handleTaskClick(task, boardKey)}
                                                            >
                                                                <Table.Td className="w-[60px]">
                                                                    <div className="flex items-center gap-1">
                                                                        <span
                                                                            {...provided.dragHandleProps}
                                                                            className="text-lg cursor-move"
                                                                        >
                                                                            <MdDragIndicator />
                                                                        </span>
                                                                        {task.projectId && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="plain"
                                                                                icon={<TbExternalLink />}
                                                                                onClick={(e) => handleExternalLinkClick(e, task.projectId)}
                                                                                className="p-1"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold heading-text truncate block" title={task.name?.toUpperCase()}>
                                                                        {task.name?.toUpperCase()}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    {task.members?.slice(0, 1).map((member, index) => (
                                                                        <div key={member.id + index} className="flex items-center gap-1">
                                                                            <Avatar
                                                                                shape="circle"
                                                                                size="sm"
                                                                                src={member.img}
                                                                            />
                                                                            <span className="font-semibold text-xs truncate" title={member.name}>
                                                                                {member.name}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {task.members?.length > 1 && (
                                                                        <span className="text-xs text-gray-500">+{task.members.length - 1}</span>
                                                                    )}
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap">
                                                                    <span className="font-semibold text-xs">
                                                                        {task.entryDate
                                                                            ? dayjs(task.entryDate).format('DD/MM/YYYY')
                                                                            : '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.tipo}>
                                                                        {task.tipo || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.eProtocolo}>
                                                                        {task.eProtocolo || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.custas}>
                                                                        {task.custas || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.vencimentoMatricula}>
                                                                        {task.vencimentoMatricula
                                                                            ? dayjs(task.vencimentoMatricula).format('DD/MM/YYYY')
                                                                            : '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.ordem}>
                                                                        {task.ordem || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.unidade}>
                                                                        {task.unidade || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.natureza}>
                                                                        {task.natureza || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.codigoValidacaoITBI}>
                                                                        {task.codigoValidacaoITBI || '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.envioITBIEscritura}>
                                                                        {task.envioITBIEscritura
                                                                            ? dayjs(task.envioITBIEscritura).format('DD/MM/YYYY')
                                                                            : '-'}
                                                                    </span>
                                                                </Table.Td>
                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                                                    <span className="font-semibold text-xs truncate block" title={task.itbiPago ? 'Sim' : 'Não'}>
                                                                        {task.itbiPago ? 'Sim' : 'Não'}
                                                                    </span>
                                                                </Table.Td>
                                                                                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.escrituraPago ? 'Sim' : 'Não'}>
                                        {task.escrituraPago ? 'Sim' : 'Não'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.envioMinuta}>
                                        {task.envioMinuta
                                            ? dayjs(task.envioMinuta).format('DD/MM/YYYY')
                                            : '-'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.minutaAprovada ? 'Sim' : 'Não'}>
                                        {task.minutaAprovada ? 'Sim' : 'Não'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.dataLavratura}>
                                        {task.dataLavratura
                                            ? dayjs(task.dataLavratura).format('DD/MM/YYYY')
                                            : '-'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.dataEnvioRegistro}>
                                        {task.dataEnvioRegistro
                                            ? dayjs(task.dataEnvioRegistro).format('DD/MM/YYYY')
                                            : '-'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.statusONR}>
                                        {task.statusONR || '-'}
                                    </span>
                                </Table.Td>
                                <Table.Td className="whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold text-xs truncate block" title={task.pendingItems && task.pendingItems.length > 0 ? `${task.pendingItems.length} pendência(s)` : 'Nenhuma pendência'}>
                                        {task.pendingItems && task.pendingItems.length > 0 ? `${task.pendingItems.length} pendência(s)` : '-'}
                                    </span>
                                </Table.Td>
                                                            </Table.Tr>
                                                        )}
                                                    </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </Table.TBody>
                                        </Table>
                                    </div>
                                )}
                            </Droppable>
                            
                            {/* Add Task button for this board */}
                            <div className="flex justify-start">
                                <AddTask
                                    groupKey={boardKey}
                                    onCreateTask={handleCreateTask}
                                    isSelected={selectedCreateTaskButton === boardKey}
                                    onSelect={() => setSelectedCreateTaskButton(boardKey)}
                                    onDeselect={() => setSelectedCreateTaskButton('')}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
            <TrashCan isVisible={isDragging} />
        </DragDropContext>
    )
}

export default TaskList
