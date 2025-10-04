import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { boardName } = await request.json()
        
        if (!boardName) {
            return NextResponse.json({ error: 'Board name is required' }, { status: 400 })
        }

        // Check if board already exists by looking for projects with this status
        const existingProjects = await prisma.project.findMany({
            where: { 
                status: boardName,
                projectType: 'registro-civil'
            }
        })

        if (existingProjects.length > 0) {
            return NextResponse.json({ error: 'Board already exists' }, { status: 409 })
        }

        // Get the current highest board order to determine the next order
        const maxOrderProject = await prisma.project.findFirst({
            where: { projectType: 'registro-civil' },
            orderBy: { boardOrder: 'desc' }
        })
        const nextBoardOrder = maxOrderProject ? maxOrderProject.boardOrder + 1 : 0

        // Create a placeholder project to represent the new board
        // This ensures the board exists in the database even when empty
        const placeholderProject = await prisma.project.create({
            data: {
                name: `Board: ${boardName}`, // Placeholder name
                status: boardName,
                projectType: 'registro-civil',
                boardOrder: nextBoardOrder, // Set the correct order
                members: JSON.stringify([]),
                labels: JSON.stringify([]),
                attachments: JSON.stringify([]),
                comments: JSON.stringify([]),
                activity: JSON.stringify([]),
                pendingItems: JSON.stringify([]),
                fieldConfiguration: JSON.stringify([]),
            }
        })

        console.log(`Board "${boardName}" created with placeholder project:`, placeholderProject.id)
        
        return NextResponse.json({ 
            success: true, 
            message: `Board "${boardName}" created successfully`,
            boardName,
            placeholderProjectId: placeholderProject.id
        })
    } catch (error) {
        console.error('Error creating board:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

