import { scrumboardData } from '@/mock/data/projectsData'
import dayjs from 'dayjs'

export const getCurrentProjectData = (projectId) => {
    // Get the current state of scrumboard data (it might have been modified)
    let currentScrumboardData = null
    
    // Try to get updated data from localStorage if available (for client-side persistence)
    if (typeof window !== 'undefined') {
        try {
            const storedData = localStorage.getItem('scrumboardData')
            if (storedData) {
                currentScrumboardData = JSON.parse(storedData)
            } else {
                // If no localStorage data, return null instead of using mock data
                return null
            }
        } catch (error) {
            console.log('Error reading localStorage data')
            return null
        }
    } else {
        // Server-side: use mock data only if no localStorage data is available
        currentScrumboardData = scrumboardData
    }
    
    // Find the project in scrum board data by projectId or id
    for (const boardName in currentScrumboardData) {
        const board = currentScrumboardData[boardName]
        
        const project = board.find(project => {
            const matchesProjectId = project.projectId === projectId
            const matchesId = project.id === projectId
            return matchesProjectId || matchesId
        })
        
        if (project) {
            // Transform the project data to match the expected structure for original IssueBody
            return {
                ...project,
                // Map members to assignees for compatibility with IssueBody component
                assignees: project.members || [],
                // Ensure labels have the expected structure (id and title)
                labels: (project.labels || []).map(label => ({
                    id: label,
                    title: label
                })),
                // Use board name as status
                status: boardName,
                // Always use ISO string format for dates - prioritize entryDate
                dueDate: project.entryDate ? 
                    (project.entryDate instanceof Date ? project.entryDate.toISOString() : 
                     typeof project.entryDate === 'string' ? project.entryDate : 
                     typeof project.entryDate === 'number' ? dayjs.unix(project.entryDate).toISOString() :
                     dayjs(project.entryDate).toISOString()) : 
                    (project.dueDate ? 
                        (project.dueDate instanceof Date ? project.dueDate.toISOString() : 
                         typeof project.dueDate === 'string' ? project.dueDate : 
                         typeof project.dueDate === 'number' ? dayjs.unix(project.dueDate).toISOString() :
                         dayjs(project.dueDate).toISOString()) : null),
                // Ensure arrays are properly initialized
                comments: project.comments || [],
                attachments: project.attachments || [],
                activity: project.activity || [],
                // Keep original members for backward compatibility
                members: project.members || [],
                // Ensure project name is available
                name: project.name || project.title || 'Untitled Project'
            }
        }
    }
    
    return null
} 