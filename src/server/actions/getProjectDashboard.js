import { projectData } from '@/mock/data/dashboardData'

const getProjectDashboard = async () => {
    // Try to get real data from localStorage first
    let realProjectData = null
    
    try {
        // Since this is a server action, we need to handle the case where localStorage is not available
        // We'll return the mock data for now, but in a real implementation, you'd want to:
        // 1. Create an API endpoint that reads from your database
        // 2. Or use a server-side storage solution
        // 3. Or pass the data from the client side
        
        // For now, we'll use the mock data but structure it to match our real data format
        const mockProjectData = {
            ...projectData,
            projectOverview: {
                ongoingProject: 0, // Will be calculated from real data
                projectCompleted: 0, // Will be calculated from real data
                upcomingProject: 0, // Will be calculated from real data
            }
        }
        
        return mockProjectData
    } catch (error) {
        console.error('Error getting project dashboard data:', error)
        return projectData
    }
}

export default getProjectDashboard
