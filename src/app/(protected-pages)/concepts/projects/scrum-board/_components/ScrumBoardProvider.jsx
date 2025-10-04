'use client'
import { useEffect, useRef, useState } from 'react'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useTasksStore } from '../../tasks/_store/tasksStore'
import { useProjectStore } from '../../_store/projectStore'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import { useScrumBoardUsers } from '../_hooks/useScrumBoardUsers'
import { BoardColorsProvider } from '../_contexts/BoardColorsContext'
import { migrateBoardsToDatabase, needsMigration } from '@/utils/migrateBoards'

const ScrumBoardProvider = ({ children, data: initialData, projectMembers = null }) => {
    const [serverData, setServerData] = useState(null)
    
    const updateColumns = useScrumBoardStore((state) => state.updateColumns)
    const updateOrdered = useScrumBoardStore((state) => state.updateOrdered)
    const updateFinalizedColumns = useScrumBoardStore((state) => state.updateFinalizedColumns)
    const updateBoardMembers = useScrumBoardStore(
        (state) => state.updateBoardMembers,
    )
    const updateAllMembers = useScrumBoardStore(
        (state) => state.updateAllMembers,
    )
    const syncWithTasks = useScrumBoardStore((state) => state.syncWithTasks)
    const updateTasks = useScrumBoardStore((state) => state.updateTasks)
    const loadFromLocalStorage = useScrumBoardStore((state) => state.loadFromLocalStorage)
    const loadBoardMembers = useScrumBoardStore((state) => state.loadBoardMembers)
    const setIsLoading = useScrumBoardStore((state) => state.setIsLoading)
    
    const tasksStore = useTasksStore()
    
    // Use the dedicated hook for managing scrum board users
    const { users, isHydrated, isInitialized, hasUsers } = useScrumBoardUsers()
    
    // Get project store for data persistence
    const { updateScrumBoardData, scrumBoardData } = useProjectStore()

    // Usamos um ref para evitar atualizações desnecessárias
    const prevDataRef = useRef(null)
    const prevMembersRef = useRef(null)
    
    // User management is now handled by useScrumBoardUsers hook
    
    // Add a function to refresh data from database
    const refreshDataFromDatabase = async () => {
        try {
            console.log('Refreshing data from database...')
            const response = await fetch('/api/projects/scrum-board')
            if (response.ok) {
                const data = await response.json()
                if (data && Object.keys(data).length > 0) {
                    console.log('Data refreshed from database:', data)
                    setServerData(data)
                    return true
                }
            }
        } catch (error) {
            console.error('Error refreshing data from database:', error)
        }
        return false
    }


    // Expose refresh function globally for other components to use
    useEffect(() => {
        window.refreshScrumBoardData = refreshDataFromDatabase
        return () => {
            delete window.refreshScrumBoardData
        }
    }, [])
    
    // Load data from project store if available (for persistence) - only on initial load
    useEffect(() => {
        if (scrumBoardData && Object.keys(scrumBoardData).length > 0 && !serverData) {
            console.log('Loading scrum board data from project store')
            setServerData(scrumBoardData)
            setIsLoading(false)
        }
    }, [scrumBoardData, serverData, setIsLoading]) // Added setIsLoading to prevent circular updates
    
    // Carregar dados do localStorage primeiro, depois do servidor se necessário
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                
                // Check if migration is needed and perform it
                if (needsMigration()) {
                    console.log('Migration needed, migrating boards to database...')
                    const migrationSuccess = await migrateBoardsToDatabase()
                    if (migrationSuccess) {
                        console.log('Migration completed successfully')
                    } else {
                        console.log('Migration failed, continuing with localStorage data')
                    }
                }
                
                // Load board members from database first
                await loadBoardMembers()
                
                // Try to load from database first
                try {
                    const response = await fetch('/api/projects/scrum-board')
                    if (response.ok) {
                        const data = await response.json()
                        if (data && Object.keys(data).length > 0) {
                            console.log('Dados carregados do banco de dados:', data)
                            setServerData(data)
                            setIsLoading(false)
                            return
                        }
                    }
                } catch (error) {
                    console.log('Erro ao carregar do banco de dados, tentando localStorage:', error)
                }
                
                // Fallback to localStorage if database fails
                // Note: Removed localStorage fallback as we now use database-first approach
                // const scrumboardData = localStorage.getItem('scrumboardData')
                // const finalizedData = localStorage.getItem('finalizedData')
                
                // if (scrumboardData || finalizedData) {
                //     if (scrumboardData) {
                //         const parsedData = JSON.parse(scrumboardData)
                //         console.log('Dados carregados do localStorage:', parsedData)
                //         setServerData(parsedData)
                //     }
                //     
                //     if (finalizedData) {
                //         const parsedFinalizedData = JSON.parse(finalizedData)
                //         console.log('Dados finalizados carregados do localStorage:', parsedFinalizedData)
                //         updateFinalizedColumns(parsedFinalizedData)
                //         
                //         // Also update tasks store if it exists
                //         if (tasksStore && tasksStore.updateFinalizedColumns) {
                //             tasksStore.updateFinalizedColumns(parsedFinalizedData)
                //         }
                //     }
                //     
                //     setIsLoading(false)
                //     return
                // }
                
                // Finalized data is now loaded from database via serverData
                
                // Final fallback to initial data
                console.log('Nenhum dado encontrado, usando dados iniciais')
                setServerData(initialData)
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                setServerData(initialData)
            } finally {
                setIsLoading(false)
            }
        }
        
        loadData()
    }, [updateFinalizedColumns, loadBoardMembers]) // Added loadBoardMembers to dependencies
    
    // Atualizar stores quando os dados do servidor estiverem disponíveis
    useEffect(() => {
        if (!serverData) return
        
        // Handle both old format (direct object) and new format (with boards and boardOrder)
        const data = serverData.boards || serverData
        let boardOrder = serverData.boardOrder || Object.keys(data)
        
        // Ensure finalized boards are always at the end
        const finalizedBoards = ['Concluídas', 'Canceladas']
        const activeBoards = boardOrder.filter(board => !finalizedBoards.includes(board))
        const finalBoardOrder = [...activeBoards, ...finalizedBoards]
        
        // Verificar se os dados realmente mudaram
        const dataChanged = !prevDataRef.current || JSON.stringify(prevDataRef.current) !== JSON.stringify(data)
        
        if (dataChanged) {
            // Atualizar o scrumBoardStore - ONLY for scrum board data, NOT for members
            updateColumns(data)
            updateOrdered(finalBoardOrder)
            
            // Update finalized columns with data from server (database)
            const finalizedData = {
                'Concluídas': data['Concluídas'] || [],
                'Canceladas': data['Canceladas'] || []
            }
            updateFinalizedColumns(finalizedData)
            
            // Atualizar diretamente o tasksStore se existir - ONLY for scrum board data, NOT for members
            if (tasksStore) {
                tasksStore.updateColumns(data)
                tasksStore.updateOrdered(finalBoardOrder)
                tasksStore.updateFinalizedColumns(finalizedData)
            }
            
            // Atualizar as referências
            prevDataRef.current = data
        }
        
        // NOTE: We completely ignore projectMembers from server and use only real users from Zustand
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverData])

    // Note: Removed localStorage event listeners as we now use database-first approach
    // Listen for localStorage changes to sync stores
    // useEffect(() => {
    //     const handleScrumboardDataChanged = () => {
    //         console.log('ScrumBoardProvider: scrumboardDataChanged event received')
    //         
    //         // Load fresh data from localStorage
    //         const scrumboardData = localStorage.getItem('scrumboardData')
    //         if (scrumboardData) {
    //             const parsedData = JSON.parse(scrumboardData)
    //             console.log('ScrumBoardProvider: Updating with new data:', parsedData)
    //             updateColumns(parsedData)
    //             updateOrdered(Object.keys(parsedData))
    //             
    //             // Also update tasks store if it exists
    //             if (tasksStore && tasksStore.updateColumns && tasksStore.updateOrdered) {
    //                 tasksStore.updateColumns(parsedData)
    //                 tasksStore.updateOrdered(Object.keys(parsedData))
    //             }
    //         }
    //     }

    //     const handleFinalizedDataChanged = () => {
    //         console.log('ScrumBoardProvider: finalizedDataChanged event received')
    //         
    //         // Load fresh finalized data from localStorage
    //         const finalizedData = localStorage.getItem('finalizedData')
    //         if (finalizedData) {
    //             const parsedData = JSON.parse(finalizedData)
    //             console.log('ScrumBoardProvider: Updating finalized data:', parsedData)
    //             updateFinalizedColumns(parsedData)
    //             
    //             // Also update tasks store if it exists
    //             if (tasksStore && tasksStore.updateFinalizedColumns) {
    //                 tasksStore.updateFinalizedColumns(parsedData)
    //             }
    //         }
    //     }

    //     window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
    //     window.addEventListener('finalizedDataChanged', handleFinalizedDataChanged)

    //     return () => {
    //         window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
    //         window.removeEventListener('finalizedDataChanged', handleFinalizedDataChanged)
    //     }
    // }, [updateColumns, updateOrdered, updateFinalizedColumns]) // Removed tasksStore to prevent infinite loop

    return (
        <BoardColorsProvider>
            {children}
        </BoardColorsProvider>
    )
}

export default ScrumBoardProvider
