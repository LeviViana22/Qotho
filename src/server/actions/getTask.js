import { scrumboardData } from '@/mock/data/projectsData'

const getTask = (params) => {
    const { id } = params
    
    // Get current scrumboard data (from localStorage if available, otherwise from mock data)
    let currentScrumboardData = null
    
    try {
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem('scrumboardData')
            if (storedData) {
                currentScrumboardData = JSON.parse(storedData)
            } else {
                // If no localStorage data, return null instead of using mock data
                return null
            }
        } else {
            // Server-side: use mock data only if no localStorage data is available
            currentScrumboardData = scrumboardData
        }
    } catch (error) {
        console.log('Error reading localStorage data for getTask')
        return null
    }
    
    // Find the project in scrum board data by projectId or id
    for (const boardName in currentScrumboardData) {
        const board = currentScrumboardData[boardName]
        
        const project = board.find(project => {
            const matchesProjectId = project.projectId === id
            const matchesId = project.id === id
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
                // Convert dueDate to timestamp if it's a Date object
                dueDate: project.dueDate ? (project.dueDate instanceof Date ? project.dueDate.getTime() / 1000 : project.dueDate) : null,
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

export default getTask
