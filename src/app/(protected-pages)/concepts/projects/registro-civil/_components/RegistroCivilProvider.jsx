'use client'
import { useEffect, useRef, useState } from 'react'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
// Removed tasksStore import - Registro Civil is completely separate
import { useProjectStore } from '../../_store/projectStore'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import { useRegistroCivilUsers } from '../_hooks/useRegistroCivilUsers'
import { BoardColorsProvider } from '../_contexts/BoardColorsContext'
// Removed migration import - Registro Civil should be completely separate

const RegistroCivilProvider = ({ children, data: initialData, projectMembers = null }) => {
    const [serverData, setServerData] = useState(null)
    
    const updateColumns = useRegistroCivilStore((state) => state.updateColumns)
    const updateOrdered = useRegistroCivilStore((state) => state.updateOrdered)
    const updateFinalizedColumns = useRegistroCivilStore((state) => state.updateFinalizedColumns)
    const updateBoardMembers = useRegistroCivilStore(
        (state) => state.updateBoardMembers,
    )
    const updateAllMembers = useRegistroCivilStore(
        (state) => state.updateAllMembers,
    )
    // Removed syncWithTasks and updateTasks - Registro Civil is completely separate
    const loadFromLocalStorage = useRegistroCivilStore((state) => state.loadFromLocalStorage)
    const loadBoardMembers = useRegistroCivilStore((state) => state.loadBoardMembers)
    const setIsLoading = useRegistroCivilStore((state) => state.setIsLoading)
    
    // Removed tasksStore - Registro Civil is completely separate
    
    // Use the dedicated hook for managing registro civil users
    const { users, isHydrated, isInitialized, hasUsers } = useRegistroCivilUsers()
    
    // Get project store for data persistence
    const { updateScrumBoardData, scrumBoardData } = useProjectStore()

    // Usamos um ref para evitar atualizações desnecessárias
    const prevDataRef = useRef(null)
    const prevMembersRef = useRef(null)
    
    // User management is now handled by useRegistroCivilUsers hook
    
    // Add a function to refresh data from database
    const refreshDataFromDatabase = async () => {
        try {
            const response = await fetch('/api/projects/registro-civil')
            if (response.ok) {
                const data = await response.json()
                if (data && Object.keys(data).length > 0) {
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
        window.refreshRegistroCivilData = refreshDataFromDatabase
        return () => {
            delete window.refreshRegistroCivilData
        }
    }, [])
    
    // Don't load from project store for registro civil - always use fresh database data
    // This prevents old localStorage data from overwriting fresh database data
    
    // Carregar dados do localStorage primeiro, depois do servidor se necessário
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                
                // Registro Civil doesn't need migration - it's a separate system
                
                // Load board members from database first
                await loadBoardMembers()
                
                // Try to load from database first
                try {
                    const response = await fetch('/api/projects/registro-civil')
                    if (response.ok) {
                        const data = await response.json()
                        console.log('Loaded data from database on page reload:', data)
                        if (data && Object.keys(data).length > 0) {
                            setServerData(data)
                            setIsLoading(false)
                            return
                        }
                    }
                } catch (error) {
                    console.error('Error loading from database:', error)
                    // Error loading from database, will try localStorage
                }
                
                // No fallback - if database fails, keep empty state
                setServerData({})
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                setServerData({})
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
        
        // Use data directly like scrum board for better performance
        const sanitizedData = data
        
        // Ensure finalized boards are always at the end
        const finalizedBoards = ['Concluídas', 'Canceladas']
        const activeBoards = boardOrder.filter(board => !finalizedBoards.includes(board))
        const finalBoardOrder = [...activeBoards, ...finalizedBoards]
        
        // Verificar se os dados realmente mudaram
        const dataChanged = !prevDataRef.current || JSON.stringify(prevDataRef.current) !== JSON.stringify(data)
        
        if (dataChanged) {
            // Atualizar o registroCivilStore - ONLY for registro civil data, NOT for members
            updateColumns(data)
            updateOrdered(finalBoardOrder)
            
            // Update finalized columns with data from server (database)
            const finalizedData = {
                'Concluídas': data['Concluídas'] || [],
                'Canceladas': data['Canceladas'] || []
            }
            updateFinalizedColumns(finalizedData)
            
            // NOTE: Registro Civil is completely separate from tasks/scrum board
            // No need to sync with tasksStore to prevent conflicts
            
            // Atualizar as referências
            prevDataRef.current = data
        }
        
        // NOTE: We completely ignore projectMembers from server and use only real users from Zustand
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverData])

    return (
        <BoardColorsProvider>
            {children}
        </BoardColorsProvider>
    )
}

export default RegistroCivilProvider

