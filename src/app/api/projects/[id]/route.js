import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const project = await prisma.project.findUnique({
            where: { id }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
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

        return NextResponse.json(transformedProject)
    } catch (error) {
        console.error('Error fetching project:', error)
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const updateData = await request.json()

        // Get current project to compare changes
        const currentProject = await prisma.project.findUnique({
            where: { id }
        })

        if (!currentProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
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
            fieldConfiguration: JSON.stringify(updateData.fieldConfiguration || []),
            updatedAt: new Date()
        }

        // Update the project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: dbUpdateData
        })

        // Transform back to scrum board format
        const transformedProject = {
            id: updatedProject.id,
            projectId: updatedProject.projectId || updatedProject.id,
            name: updatedProject.name,
            description: updatedProject.description,
            status: updatedProject.status,
            members: updatedProject.members ? JSON.parse(updatedProject.members) : [],
            labels: updatedProject.labels ? JSON.parse(updatedProject.labels) : [],
            attachments: updatedProject.attachments ? JSON.parse(updatedProject.attachments) : [],
            comments: updatedProject.comments ? JSON.parse(updatedProject.comments) : [],
            activity: updatedProject.activity ? JSON.parse(updatedProject.activity) : [],
            dueDate: updatedProject.dueDate,
            assignedTo: updatedProject.assignedTo,
            label: updatedProject.label,
            pendingItems: updatedProject.pendingItems ? JSON.parse(updatedProject.pendingItems) : [],
            fieldConfiguration: updatedProject.fieldConfiguration ? JSON.parse(updatedProject.fieldConfiguration) : [],
            createdAt: updatedProject.createdAt,
            updatedAt: updatedProject.updatedAt
        }

        return NextResponse.json(transformedProject)
    } catch (error) {
        console.error('Error updating project:', error)
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Check if project exists
        const existingProject = await prisma.project.findUnique({
            where: { id }
        })

        if (!existingProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Delete the project
        await prisma.project.delete({
            where: { id }
        })

        console.log(`Project ${id} deleted successfully`)
        return NextResponse.json({ success: true, message: 'Project deleted successfully' })
    } catch (error) {
        console.error('Error deleting project:', error)
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }
}