import { prisma } from '@/lib/prisma'

export async function POST(request) {
    try {
        const projectData = await request.json()
        console.log('Creating registro-civil project with data:', JSON.stringify(projectData, null, 2))

        // Validate required fields
        if (!projectData.id) {
            return Response.json(
                { error: 'Project ID is required' },
                { status: 400 }
            )
        }

        if (!projectData.name) {
            return Response.json(
                { error: 'Project name is required' },
                { status: 400 }
            )
        }

        if (!projectData.status) {
            return Response.json(
                { error: 'Project status is required' },
                { status: 400 }
            )
        }

        // Prepare data for database insertion - include dynamic fields
        const dbProjectData = {
            id: projectData.id,
            projectId: projectData.projectId || projectData.id,
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status,
            boardOrder: projectData.boardOrder || 0,
            members: projectData.members || '[]', // Already JSON stringified
            labels: projectData.labels || '[]', // Already JSON stringified
            attachments: projectData.attachments || '[]', // Already JSON stringified
            comments: projectData.comments || '[]', // Already JSON stringified
            activity: projectData.activity || '[]', // Already JSON stringified
            dueDate: projectData.dueDate,
            assignedTo: projectData.assignedTo || '',
            label: projectData.label || '',
            pendingItems: projectData.pendingItems || '[]', // Already JSON stringified
            fieldConfiguration: projectData.fieldConfiguration || '{}', // Already JSON stringified
            projectType: 'registro-civil',
            createdAt: projectData.createdAt ? new Date(projectData.createdAt) : new Date(),
            updatedAt: new Date()
        }

        // Handle dynamic fields by storing them in fieldConfiguration
        const knownFields = [
            'id', 'projectId', 'name', 'description', 'status', 'boardOrder',
            'members', 'labels', 'attachments', 'comments', 'activity',
            'dueDate', 'assignedTo', 'label', 'pendingItems', 'fieldConfiguration',
            'projectType', 'createdAt', 'updatedAt'
        ]

        // Collect dynamic fields and merge them with fieldConfiguration
        const dynamicFields = {}
        Object.keys(projectData).forEach(key => {
            if (!knownFields.includes(key) && projectData[key] !== undefined) {
                dynamicFields[key] = projectData[key]
            }
        })

        // Merge dynamic fields with existing fieldConfiguration
        let fieldConfiguration = {}
        if (projectData.fieldConfiguration) {
            try {
                fieldConfiguration = typeof projectData.fieldConfiguration === 'string' 
                    ? JSON.parse(projectData.fieldConfiguration) 
                    : projectData.fieldConfiguration
            } catch (error) {
                console.error('Error parsing fieldConfiguration:', error)
                fieldConfiguration = {}
            }
        }

        // Merge dynamic fields into fieldConfiguration
        const mergedFieldConfiguration = { ...fieldConfiguration, ...dynamicFields }
        dbProjectData.fieldConfiguration = JSON.stringify(mergedFieldConfiguration)

        console.log('Creating project with db data:', JSON.stringify(dbProjectData, null, 2))

        // Test database connection
        try {
            const testConnection = await prisma.project.findFirst()
            console.log('Database connection test successful')
        } catch (dbError) {
            console.error('Database connection test failed:', dbError)
            return Response.json(
                { error: 'Database connection failed', details: dbError.message },
                { status: 500 }
            )
        }

        // Check if project with this ID already exists
        const existingProject = await prisma.project.findUnique({
            where: { id: dbProjectData.id }
        })
        
        if (existingProject) {
            console.log('Project with ID already exists:', dbProjectData.id)
            return Response.json({ 
                error: 'Project with this ID already exists',
                details: `ID ${dbProjectData.id} is already in use`
            }, { status: 409 })
        }

        // Create the project
        console.log('Attempting to create project with Prisma...')
        const project = await prisma.project.create({
            data: dbProjectData
        })
        console.log('Prisma project creation successful:', project.id)

        console.log('Registro-civil project created successfully:', project.id)
        
        // Transform back to frontend format
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

        return Response.json(transformedProject)
    } catch (error) {
        console.error('Error creating registro-civil project:', error)
        console.error('Error details:', error.message)
        console.error('Error code:', error.code)
        console.error('Error stack:', error.stack)
        
        // Check if it's a Prisma validation error
        if (error.code === 'P2002') {
            return Response.json(
                { error: 'A project with this name already exists' },
                { status: 409 }
            )
        }
        
        return Response.json(
            { error: 'Failed to create project', details: error.message },
            { status: 500 }
        )
    }
}

