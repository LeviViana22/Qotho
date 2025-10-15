import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Get all projects for Registro Civil
        const projects = await prisma.project.findMany({
            where: {
                projectType: 'registro-civil'
            },
            orderBy: {
                boardOrder: 'asc'
            }
        })

        // Group projects by board/status
        const boards = {}
        const boardOrder = []
        const boardOrderMap = new Map() // Track board order

        projects.forEach(project => {
            const boardName = project.status || 'Novo Processo'
            if (!boards[boardName]) {
                boards[boardName] = []
                // Store the board order from the first project in each board
                if (project.boardOrder !== null && project.boardOrder !== undefined) {
                    boardOrderMap.set(boardName, project.boardOrder)
                }
            }
            
            // Skip placeholder projects (they exist only to represent empty boards)
            if (project.name && project.name.startsWith('Board: ')) {
                return // Skip this project but keep the board structure
            }
            
            // Transform database project to frontend format
            const transformedProject = {
                id: project.id,
                projectId: project.projectId || project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                boardOrder: project.boardOrder,
                members: project.members ? JSON.parse(project.members) : [],
                labels: project.labels ? JSON.parse(project.labels) : [],
                attachments: project.attachments ? JSON.parse(project.attachments) : [],
                comments: project.comments ? JSON.parse(project.comments) : [],
                activity: project.activity ? JSON.parse(project.activity) : [],
                dueDate: project.dueDate,
                assignedTo: project.assignedTo,
                label: project.label,
                pendingItems: project.pendingItems ? JSON.parse(project.pendingItems) : [],
                fieldConfiguration: project.fieldConfiguration ? JSON.parse(project.fieldConfiguration) : {},
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }

            // Add dynamic fields from fieldConfiguration
            if (transformedProject.fieldConfiguration) {
                try {
                    // Validate that fieldConfiguration is a proper object
                    if (typeof transformedProject.fieldConfiguration === 'object' && 
                        transformedProject.fieldConfiguration !== null &&
                        !Array.isArray(transformedProject.fieldConfiguration)) {
                        
                        const keys = Object.keys(transformedProject.fieldConfiguration)
                        if (keys.length > 0 && keys.length < 1000) { // Reasonable limit to prevent issues
                            keys.forEach(key => {
                                if (key && typeof key === 'string' && key.length < 100) { // Validate key
                                    transformedProject[key] = transformedProject.fieldConfiguration[key]
                                }
                            })
                        }
                    }
                } catch (error) {
                    console.error('Error processing fieldConfiguration:', error)
                    // Continue without adding dynamic fields if there's an error
                }
            }
            
            boards[boardName].push(transformedProject)
        })

        // Sort boards by their order and create the final boardOrder array
        const sortedBoards = Array.from(boardOrderMap.entries())
            .sort((a, b) => a[1] - b[1])
            .map(([boardName]) => boardName)
        
        // Add any boards that don't have a boardOrder (fallback)
        Object.keys(boards).forEach(boardName => {
            if (!sortedBoards.includes(boardName)) {
                sortedBoards.push(boardName)
            }
        })

        // Ensure we have at least the default board for registro civil
        if (sortedBoards.length === 0) {
            boards['Novo Processo'] = []
            sortedBoards.push('Novo Processo')
        }

        const result = {
            boards,
            boardOrder: sortedBoards
        }
        
        console.log('API returning data:', JSON.stringify(result, null, 2))
        
        return Response.json(result)
    } catch (error) {
        console.error('Error fetching registro civil data:', error)
        return Response.json(
            { error: 'Failed to fetch registro civil data' },
            { status: 500 }
        )
    }
}

