import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { projectType: 'scrum-board' },
                    { projectType: 'escrituras' },
                    { projectType: null } // For backward compatibility with existing data
                ]
            },
            orderBy: { boardOrder: 'asc' }
        })

        // Transform projects back to scrum board format
        const scrumBoardData = {}
        const boardOrderMap = {} // Track board order for proper sorting
        
        projects.forEach(project => {
            const boardName = project.status
            if (!boardName) {
                console.warn(`Project ${project.id} has no status, skipping`)
                return
            }
            if (!scrumBoardData[boardName]) {
                scrumBoardData[boardName] = []
            }
            
            // Track the board order from the first project we encounter for each board
            if (!boardOrderMap[boardName]) {
                boardOrderMap[boardName] = project.boardOrder || 0
            }
            
            // Skip placeholder projects (they exist only to represent empty boards)
            // But keep the board structure by not adding the project to the array
            if (project.name && project.name.startsWith('Board: ')) {
                // Still track the board order for empty boards
                if (!boardOrderMap[boardName]) {
                    boardOrderMap[boardName] = project.boardOrder || 0
                }
                return // Skip this project but keep the board structure
            }
            
            // Transform database project to scrum board format
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
                fieldConfiguration: project.fieldConfiguration ? JSON.parse(project.fieldConfiguration) : [],
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }
            
            scrumBoardData[boardName].push(transformedProject)
        })

        // Ensure finalized boards exist (Concluídas and Canceladas)
        if (!scrumBoardData['Concluídas']) {
            scrumBoardData['Concluídas'] = []
            boardOrderMap['Concluídas'] = 9998 // High order for finalized boards
        }
        if (!scrumBoardData['Canceladas']) {
            scrumBoardData['Canceladas'] = []
            boardOrderMap['Canceladas'] = 9999 // Highest order for finalized boards
        }
        
        // Sort boards by their order and return with proper ordering
        const sortedBoardNames = Object.keys(scrumBoardData).sort((a, b) => {
            return (boardOrderMap[a] || 0) - (boardOrderMap[b] || 0)
        })
        
        // Create ordered response data
        const responseData = {
            boards: scrumBoardData,
            boardOrder: sortedBoardNames
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('Error fetching scrum board data:', error)
        return NextResponse.json({ error: 'Failed to fetch scrum board data' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const scrumBoardData = await request.json()
        
        // Clear existing projects
        await prisma.project.deleteMany({})
        
        // Insert new projects
        const projectsToInsert = []
        
        for (const [boardName, projects] of Object.entries(scrumBoardData)) {
            if (Array.isArray(projects)) {
                projects.forEach(project => {
                    projectsToInsert.push({
                        id: project.id,
                        projectId: project.projectId,
                        name: project.name,
                        description: project.description,
                        status: boardName,
                        boardOrder: project.boardOrder || 0,
                        members: JSON.stringify(project.members || []),
                        labels: JSON.stringify(project.labels || []),
                        attachments: JSON.stringify(project.attachments || []),
                        comments: JSON.stringify(project.comments || []),
                        activity: JSON.stringify(project.activity || []),
                        dueDate: project.dueDate,
                        assignedTo: project.assignedTo,
                        label: project.label,
                        pendingItems: JSON.stringify(project.pendingItems || []),
                        fieldConfiguration: JSON.stringify(project.fieldConfiguration || []),
                        projectType: 'scrum-board', // Set project type for scrum board projects
                        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
                        updatedAt: new Date()
                    })
                })
            }
        }
        
        if (projectsToInsert.length > 0) {
            await prisma.project.createMany({
                data: projectsToInsert
            })
        }

        console.log('Dados do scrumboard atualizados com sucesso:', scrumBoardData)
        return NextResponse.json({ success: true, message: 'Dados atualizados com sucesso' })
    } catch (error) {
        console.error('Erro ao atualizar dados do scrumboard:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
