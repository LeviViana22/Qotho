import { prisma } from '@/lib/prisma'

export async function PUT(request) {
    try {
        const { boardOrder } = await request.json()

        if (!boardOrder || !Array.isArray(boardOrder)) {
            return Response.json(
                { error: 'Board order is required and must be an array' },
                { status: 400 }
            )
        }

        // Update the board order for each board by updating the boardOrder field
        // of the first project in each board (or create a placeholder if needed)
        for (let i = 0; i < boardOrder.length; i++) {
            const boardName = boardOrder[i]
            const order = i
            
            // Find the first project in this board
            const firstProject = await prisma.project.findFirst({
                where: {
                    status: boardName,
                    projectType: 'registro-civil'
                },
                orderBy: { createdAt: 'asc' }
            })
            
            if (firstProject) {
                // Update the existing project's board order
                await prisma.project.update({
                    where: { id: firstProject.id },
                    data: { boardOrder: order }
                })
            } else {
                // Create a placeholder project for this board if it doesn't exist
                await prisma.project.create({
                    data: {
                        name: `Board: ${boardName}`,
                        status: boardName,
                        projectType: 'registro-civil',
                        boardOrder: order,
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
        }

        console.log('Board order updated for registro civil:', boardOrder)

        return Response.json({
            message: 'Board order updated successfully',
            boardOrder
        })
    } catch (error) {
        console.error('Error updating board order:', error)
        return Response.json(
            { error: 'Failed to update board order' },
            { status: 500 }
        )
    }
}

