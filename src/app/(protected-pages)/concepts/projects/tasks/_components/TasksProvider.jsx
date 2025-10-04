'use client'
import { useEffect, useRef, useState } from 'react'
import { useTasksStore } from '../_store/tasksStore'
import { useScrumBoardStore } from '../../scrum-board/_store/scrumBoardStore'

const TasksProvider = ({ children, data: initialData, projectMembers }) => {
    const [serverData, setServerData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    
    const updateOrdered = useTasksStore((state) => state.updateOrdered)
    const updateColumns = useTasksStore((state) => state.updateColumns)
    const updateFinalizedColumns = useTasksStore((state) => state.updateFinalizedColumns)
    const updateBoardMembers = useTasksStore(
        (state) => state.updateBoardMembers,
    )
    const updateAllMembers = useTasksStore((state) => state.updateAllMembers)
    const syncWithScrumBoard = useTasksStore((state) => state.syncWithScrumBoard)
    const updateScrumBoard = useTasksStore((state) => state.updateScrumBoard)
    const loadFromLocalStorage = useTasksStore((state) => state.loadFromLocalStorage)
    
    const scrumBoardStore = useScrumBoardStore()

    // Usamos um ref para evitar atualizações desnecessárias
    const prevDataRef = useRef(null)
    const prevMembersRef = useRef(null)
    
    // Carregar dados do localStorage primeiro, depois do servidor se necessário
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                
                // Primeiro, tentar carregar do localStorage
                const scrumboardData = localStorage.getItem('scrumboardData')
                const finalizedData = localStorage.getItem('finalizedData')
                
                if (scrumboardData || finalizedData) {
                    if (scrumboardData) {
                        const parsedData = JSON.parse(scrumboardData)
                        console.log('Dados carregados do localStorage:', parsedData)
                        setServerData(parsedData)
                    }
                    
                    if (finalizedData) {
                        const parsedFinalizedData = JSON.parse(finalizedData)
                        console.log('Dados finalizados carregados do localStorage:', parsedFinalizedData)
                        updateFinalizedColumns(parsedFinalizedData)
                        
                        // Also update scrum board store if it exists
                        if (scrumBoardStore && scrumBoardStore.updateFinalizedColumns) {
                            scrumBoardStore.updateFinalizedColumns(parsedFinalizedData)
                        }
                    }
                    
                    setIsLoading(false)
                    return
                }
                
                // Se não há dados no localStorage, tentar do servidor
                const ProjectDataService = (await import('@/services/ProjectDataService')).default
                const response = await ProjectDataService.getTasksData()
                if (response && Object.keys(response).length > 0) {
                    console.log('Dados carregados do servidor:', response)
                    setServerData(response)
                } else {
                    console.log('Nenhum dado encontrado no servidor, usando dados iniciais')
                    setServerData(initialData)
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                setServerData(initialData)
            } finally {
                setIsLoading(false)
            }
        }
        
        loadData()
    }, [updateFinalizedColumns, scrumBoardStore])
    
    // Atualizar stores quando os dados do servidor estiverem disponíveis
    useEffect(() => {
        if (!serverData || isLoading) return
        
        const data = serverData
        
        // Verificar se os dados realmente mudaram
        const dataChanged = !prevDataRef.current || JSON.stringify(prevDataRef.current) !== JSON.stringify(data)
        const membersChanged = !prevMembersRef.current || 
                             JSON.stringify(prevMembersRef.current) !== JSON.stringify(projectMembers)
        
        if (dataChanged || membersChanged) {
            console.log('Atualizando stores com dados:', data)
            
            // Atualizar o tasksStore
            updateOrdered(Object.keys(data))
            updateColumns(data)
            updateBoardMembers(projectMembers.participantMembers)
            updateAllMembers(projectMembers.allMembers)
            
            // Atualizar diretamente o scrumBoardStore se existir
            if (scrumBoardStore) {
                scrumBoardStore.updateColumns(data)
                scrumBoardStore.updateOrdered(Object.keys(data))
                scrumBoardStore.updateBoardMembers(projectMembers.participantMembers)
                scrumBoardStore.updateAllMembers(projectMembers.allMembers)
            }
            
            // Atualizar as referências
            prevDataRef.current = data
            prevMembersRef.current = projectMembers
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverData, isLoading, projectMembers])

    // Listen for localStorage changes to sync stores
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            console.log('TasksProvider: scrumboardDataChanged event received')
            
            // Load fresh data from localStorage
            const scrumboardData = localStorage.getItem('scrumboardData')
            if (scrumboardData) {
                const parsedData = JSON.parse(scrumboardData)
                console.log('TasksProvider: Updating with new data:', parsedData)
                updateColumns(parsedData)
                updateOrdered(Object.keys(parsedData))
                
                // Also update scrum board store if it exists
                if (scrumBoardStore && scrumBoardStore.updateColumns && scrumBoardStore.updateOrdered) {
                    scrumBoardStore.updateColumns(parsedData)
                    scrumBoardStore.updateOrdered(Object.keys(parsedData))
                }
            }
        }

        const handleFinalizedDataChanged = () => {
            console.log('TasksProvider: finalizedDataChanged event received')
            
            // Load fresh finalized data from localStorage
            const finalizedData = localStorage.getItem('finalizedData')
            if (finalizedData) {
                const parsedData = JSON.parse(finalizedData)
                console.log('TasksProvider: Updating finalized data:', parsedData)
                updateFinalizedColumns(parsedData)
                
                // Also update scrum board store if it exists
                if (scrumBoardStore && scrumBoardStore.updateFinalizedColumns) {
                    scrumBoardStore.updateFinalizedColumns(parsedData)
                }
            }
        }

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
        window.addEventListener('finalizedDataChanged', handleFinalizedDataChanged)

        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
            window.removeEventListener('finalizedDataChanged', handleFinalizedDataChanged)
        }
    }, [updateColumns, updateOrdered, updateFinalizedColumns, scrumBoardStore])

    return <>{children}</>
}

export default TasksProvider
