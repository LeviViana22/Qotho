import { prisma } from '@/lib/prisma'

export async function PUT(request) {
    try {
        const { oldBoardName, newBoardName } = await request.json()

        if (!oldBoardName || !newBoardName) {
            return Response.json(
                { error: 'Both old and new board names are required' },
                { status: 400 }
            )
        }

        // Prevent renaming of special finalized boards
        if (oldBoardName === 'Concluídas' || oldBoardName === 'Canceladas') {
            return Response.json(
                { error: 'Cannot rename finalized boards' },
                { status: 400 }
            )
        }

        // Prevent using reserved board names
        if (newBoardName === 'Concluídas' || newBoardName === 'Canceladas') {
            return Response.json(
                { error: 'Cannot use reserved board names' },
                { status: 400 }
            )
        }

        // Update all projects with the old board name to the new board name
        await prisma.project.updateMany({
            where: {
                projectType: 'registro-civil',
                status: oldBoardName
            },
            data: {
                status: newBoardName
            }
        })

        // Update board color entry
        const boardColor = await prisma.boardColor.findUnique({
            where: {
                boardName: oldBoardName
            }
        })

        if (boardColor) {
            // Delete old color entry
            await prisma.boardColor.delete({
                where: {
                    boardName: oldBoardName
                }
            })

            // Create new color entry
            await prisma.boardColor.create({
                data: {
                    boardName: newBoardName,
                    projectType: 'registro-civil',
                    color: boardColor.color
                }
            })
        }

        return Response.json({
            message: 'Board renamed successfully',
            oldBoardName,
            newBoardName
        })
    } catch (error) {
        console.error('Error renaming board:', error)
        return Response.json(
            { error: 'Failed to rename board' },
            { status: 500 }
        )
    }
}

