'use client'
import { useEffect } from 'react'
import { useProjectStore } from '../../_store/projectStore'
import getScrumboardData from '@/server/actions/getScrumboardData'

const ProjectDetailsProvider = ({ children, projectId }) => {
    const { updateScrumBoardData, scrumBoardData } = useProjectStore()

    // Initialize store with data from server
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load data from server if not already loaded
                if (!scrumBoardData || Object.keys(scrumBoardData).length === 0) {
                    const serverData = await getScrumboardData()
                    updateScrumBoardData(serverData)
                }
            } catch (error) {
                console.error('Error loading scrum board data:', error)
            }
        }

        loadData()
    }, [updateScrumBoardData, scrumBoardData])

    // Listen for localStorage changes to sync stores
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            console.log('ProjectDetailsProvider: scrumboardDataChanged event received')
            
            // Load fresh data from localStorage
            const scrumboardData = localStorage.getItem('scrumboardData')
            if (scrumboardData) {
                const parsedData = JSON.parse(scrumboardData)
                console.log('ProjectDetailsProvider: Updating with new data:', parsedData)
                updateScrumBoardData(parsedData)
            }
        }

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged)

        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
        }
    }, [updateScrumBoardData])

    return <>{children}</>
}

export default ProjectDetailsProvider
