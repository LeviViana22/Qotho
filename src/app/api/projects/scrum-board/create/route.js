import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projectData = await request.json()
        
        if (!projectData.id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Get the current highest board order to determine the next order
        const maxOrderProject = await prisma.project.findFirst({
            where: { projectType: 'scrum-board' },
            orderBy: { boardOrder: 'desc' }
        })
        const boardOrder = maxOrderProject ? maxOrderProject.boardOrder + 1 : 0

        const dbProjectData = {
            id: projectData.id,
            projectId: projectData.projectId || projectData.id,
            name: projectData.name || 'Untitled Task',
            description: projectData.description || '',
            status: projectData.status,
            boardOrder: boardOrder,
            members: projectData.members || JSON.stringify([]),
            labels: projectData.labels || JSON.stringify(['Task']),
            attachments: projectData.attachments || JSON.stringify([]),
            comments: projectData.comments || JSON.stringify([]),
            activity: projectData.activity || JSON.stringify([]),
            dueDate: projectData.dueDate,
            assignedTo: projectData.assignedTo || '',
            label: projectData.label || '',
            pendingItems: projectData.pendingItems || JSON.stringify([]),
            fieldConfiguration: projectData.fieldConfiguration || JSON.stringify([]),
            projectType: 'scrum-board',
            createdAt: projectData.createdAt ? new Date(projectData.createdAt) : new Date(),
            updatedAt: new Date()
        }

        // Add all dynamic fields from the project data
        Object.keys(projectData).forEach(key => {
            if (!['id', 'projectId', 'name', 'description', 'status', 'boardOrder', 'members', 'labels', 'attachments', 'comments', 'activity', 'pendingItems', 'fieldConfiguration', 'dueDate', 'assignedTo', 'label', 'projectType', 'createdAt', 'updatedAt'].includes(key)) {
                dbProjectData[key] = projectData[key]
            }
        })

        console.log('Creating scrum-board project with data:', JSON.stringify(dbProjectData, null, 2))
        
        // Check if project with this ID already exists
        const existingProject = await prisma.project.findUnique({
            where: { id: dbProjectData.id }
        })
        
        if (existingProject) {
            console.log('Project with ID already exists:', dbProjectData.id)
            return NextResponse.json({ 
                error: 'Project with this ID already exists',
                details: `ID ${dbProjectData.id} is already in use`
            }, { status: 409 })
        }
        
        let createdProject
        try {
            createdProject = await prisma.project.create({
                data: dbProjectData
            })
        } catch (dbError) {
            console.error('Database error creating project:', dbError)
            return NextResponse.json({ 
                error: 'Database error creating project',
                details: dbError.message
            }, { status: 500 })
        }

        console.log('Scrum-board project created successfully:', createdProject.id)
        return NextResponse.json(createdProject)
    } catch (error) {
        console.error('Error creating scrum-board project:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
