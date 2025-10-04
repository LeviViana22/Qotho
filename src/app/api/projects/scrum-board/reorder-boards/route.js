import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { boardOrder } = await request.json()

        if (!Array.isArray(boardOrder)) {
            return NextResponse.json({ error: 'Board order must be an array' }, { status: 400 })
        }

        // Update board order for all projects
        const updatePromises = boardOrder.map((boardName, index) => {
            return prisma.project.updateMany({
                where: { status: boardName },
                data: { boardOrder: index }
            })
        })

        await Promise.all(updatePromises)

        // Ensure empty boards have placeholder projects to maintain their order
        const emptyBoardPromises = boardOrder.map(async (boardName, index) => {
            const existingProjects = await prisma.project.findMany({
                where: { status: boardName }
            })
            
            // If board is empty, create a placeholder project
            if (existingProjects.length === 0) {
                await prisma.project.create({
                    data: {
                        name: `Board: ${boardName}`,
                        status: boardName,
                        boardOrder: index,
                        members: JSON.stringify([]),
                        labels: JSON.stringify([]),
                        attachments: JSON.stringify([]),
                        comments: JSON.stringify([]),
                        activity: JSON.stringify([]),
                        pendingItems: JSON.stringify([]),
                        fieldConfiguration: JSON.stringify([]),
                    }
                })
            }
        })

        await Promise.all(emptyBoardPromises)

        // Ensure finalized boards maintain their high order values
        const finalizedBoards = ['Concluídas', 'Canceladas']
        const finalizedUpdatePromises = finalizedBoards.map(async (boardName, index) => {
            const finalOrder = boardOrder.length + index // Place after all active boards
            await prisma.project.updateMany({
                where: { status: boardName },
                data: { boardOrder: finalOrder }
            })
        })

        await Promise.all(finalizedUpdatePromises)

        console.log('Board order updated successfully:', boardOrder)
        
        return NextResponse.json({ 
            success: true, 
            message: 'Board order updated successfully',
            boardOrder
        })
    } catch (error) {
        console.error('Error updating board order:', error)
        return NextResponse.json({ error: 'Failed to update board order' }, { status: 500 })
    }
}
