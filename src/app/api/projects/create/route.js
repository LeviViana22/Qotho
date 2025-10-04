import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            console.log('Unauthorized: No session or user')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projectData = await request.json()
        console.log('Received project data:', JSON.stringify(projectData, null, 2))
        
        // Set boardOrder to 0 for all projects (not used for ordering anymore)
        const boardOrder = 0;

        // Prepare data for database insertion
        if (!projectData.status) {
            return NextResponse.json({ error: 'Project status is required' }, { status: 400 })
        }

        const dbProjectData = {
            id: projectData.id,
            projectId: projectData.projectId || projectData.id,
            name: projectData.name || 'Untitled Task',
            description: projectData.description || 'Observações',
            status: projectData.status,
            boardOrder: boardOrder,
            members: JSON.stringify(projectData.members || []),
            labels: JSON.stringify(projectData.labels || ['Task']),
            attachments: JSON.stringify(projectData.attachments || []),
            comments: JSON.stringify(projectData.comments || []),
            activity: JSON.stringify(projectData.activity || []),
            dueDate: projectData.dueDate,
            assignedTo: projectData.assignedTo || '',
            label: projectData.label || '',
            pendingItems: JSON.stringify(projectData.pendingItems || []),
            fieldConfiguration: JSON.stringify(projectData.fieldConfiguration || []),
            projectType: projectData.projectType || 'scrum-board', // Use project type from request or default to scrum-board
            createdAt: projectData.createdAt ? new Date(projectData.createdAt) : new Date(),
            updatedAt: new Date()
        }

        // Create the project
        console.log('Creating project with data:', JSON.stringify(dbProjectData, null, 2))
        
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
            console.log('Project created successfully:', createdProject.id)
        } catch (prismaError) {
            console.error('Prisma error details:', {
                code: prismaError.code,
                message: prismaError.message,
                meta: prismaError.meta
            })
            throw prismaError
        }

        // Transform back to scrum board format
        const transformedProject = {
            id: createdProject.id,
            projectId: createdProject.projectId || createdProject.id,
            name: createdProject.name,
            description: createdProject.description,
            status: createdProject.status,
            members: createdProject.members ? JSON.parse(createdProject.members) : [],
            labels: createdProject.labels ? JSON.parse(createdProject.labels) : [],
            attachments: createdProject.attachments ? JSON.parse(createdProject.attachments) : [],
            comments: createdProject.comments ? JSON.parse(createdProject.comments) : [],
            activity: createdProject.activity ? JSON.parse(createdProject.activity) : [],
            dueDate: createdProject.dueDate,
            assignedTo: createdProject.assignedTo,
            label: createdProject.label,
            pendingItems: createdProject.pendingItems ? JSON.parse(createdProject.pendingItems) : [],
            fieldConfiguration: createdProject.fieldConfiguration ? JSON.parse(createdProject.fieldConfiguration) : [],
            createdAt: createdProject.createdAt,
            updatedAt: createdProject.updatedAt
        }

        console.log('Project created successfully:', transformedProject.id)
        return NextResponse.json(transformedProject)
    } catch (error) {
        console.error('Error creating project:', error)
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        })
        return NextResponse.json({ 
            error: 'Failed to create project', 
            details: error.message 
        }, { status: 500 })
    }
}
