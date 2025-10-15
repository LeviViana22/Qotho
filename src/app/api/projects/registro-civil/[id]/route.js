import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
    try {
        const { id } = await params

        const project = await prisma.project.findUnique({
            where: {
                id: id,
                projectType: 'registro-civil'
            }
        })

        if (!project) {
            return Response.json(
                { error: 'Project not found' },
                { status: 404 }
            )
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

        return Response.json(transformedProject)
    } catch (error) {
        console.error('Error fetching project:', error)
        return Response.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        )
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const updateData = await request.json()
        
        console.log('API PUT received:', {
            id: id,
            updateData: updateData,
            fieldConfiguration: updateData.fieldConfiguration
        })

        // Get current project to compare changes
        const currentProject = await prisma.project.findUnique({
            where: {
                id: id,
                projectType: 'registro-civil'
            }
        })

        if (!currentProject) {
            return Response.json({ error: 'Project not found' }, { status: 404 })
        }

        // Prepare update data for database
        const dbUpdateData = {
            name: updateData.name,
            description: updateData.description,
            status: updateData.status,
            boardOrder: updateData.boardOrder || currentProject.boardOrder,
            members: JSON.stringify(updateData.members || []),
            labels: JSON.stringify(updateData.labels || []),
            attachments: JSON.stringify(updateData.attachments || []),
            comments: JSON.stringify(updateData.comments || []),
            activity: JSON.stringify(updateData.activity || []),
            dueDate: updateData.dueDate,
            assignedTo: updateData.assignedTo,
            label: updateData.label,
            pendingItems: JSON.stringify(updateData.pendingItems || []),
            fieldConfiguration: JSON.stringify(updateData.fieldConfiguration || {}),
            updatedAt: new Date()
        }

        // Handle dynamic fields by storing them in fieldConfiguration
        const knownFields = [
            'id', 'projectId', 'name', 'description', 'status', 'boardOrder',
            'members', 'labels', 'attachments', 'comments', 'activity',
            'dueDate', 'assignedTo', 'label', 'pendingItems', 'fieldConfiguration',
            'projectType', 'createdAt', 'updatedAt'
        ]

        // The frontend already sends the complete fieldConfiguration with all dynamic fields
        // Just use the fieldConfiguration as-is, no need to merge with existing data
        if (updateData.fieldConfiguration) {
            try {
                // Validate that fieldConfiguration is a proper object
                const fieldConfig = typeof updateData.fieldConfiguration === 'string' 
                    ? JSON.parse(updateData.fieldConfiguration) 
                    : updateData.fieldConfiguration
                
                if (typeof fieldConfig === 'object' && fieldConfig !== null && !Array.isArray(fieldConfig)) {
                    dbUpdateData.fieldConfiguration = JSON.stringify(fieldConfig)
                } else {
                    console.error('Invalid fieldConfiguration format:', fieldConfig)
                    dbUpdateData.fieldConfiguration = JSON.stringify({})
                }
            } catch (error) {
                console.error('Error parsing fieldConfiguration:', error)
                dbUpdateData.fieldConfiguration = JSON.stringify({})
            }
        } else {
            dbUpdateData.fieldConfiguration = JSON.stringify({})
        }

        // Update the project
        let updatedProject
        try {
            updatedProject = await prisma.project.update({
                where: {
                    id: id,
                    projectType: 'registro-civil'
                },
                data: dbUpdateData
            })
        } catch (prismaError) {
            console.error('Prisma update error:', prismaError)
            console.error('Update data:', dbUpdateData)
            throw prismaError
        }

        // Transform back to frontend format
        const transformedProject = {
            id: updatedProject.id,
            projectId: updatedProject.projectId || updatedProject.id,
            name: updatedProject.name,
            description: updatedProject.description,
            status: updatedProject.status,
            boardOrder: updatedProject.boardOrder,
            members: updatedProject.members ? JSON.parse(updatedProject.members) : [],
            labels: updatedProject.labels ? JSON.parse(updatedProject.labels) : [],
            attachments: updatedProject.attachments ? JSON.parse(updatedProject.attachments) : [],
            comments: updatedProject.comments ? JSON.parse(updatedProject.comments) : [],
            activity: updatedProject.activity ? JSON.parse(updatedProject.activity) : [],
            dueDate: updatedProject.dueDate,
            assignedTo: updatedProject.assignedTo,
            label: updatedProject.label,
            pendingItems: updatedProject.pendingItems ? JSON.parse(updatedProject.pendingItems) : [],
            fieldConfiguration: updatedProject.fieldConfiguration ? JSON.parse(updatedProject.fieldConfiguration) : {},
            createdAt: updatedProject.createdAt,
            updatedAt: updatedProject.updatedAt
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

        return Response.json(transformedProject)
    } catch (error) {
        console.error('Error updating project:', error)
        return Response.json(
            { error: 'Failed to update project' },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params

        await prisma.project.delete({
            where: {
                id: id,
                projectType: 'registro-civil'
            }
        })

        return Response.json({ message: 'Project deleted successfully' })
    } catch (error) {
        console.error('Error deleting project:', error)
        return Response.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        )
    }
}