import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all unique board names (status values) and their current order
        const boards = await prisma.project.findMany({
            select: { status: true, boardOrder: true },
            distinct: ['status'],
            orderBy: { createdAt: 'asc' } // Use creation order as fallback
        })

        // Assign proper board order values
        const boardOrderUpdates = []
        boards.forEach((board, index) => {
            if (board.status) {
                boardOrderUpdates.push({
                    status: board.status,
                    boardOrder: index
                })
            }
        })

        // Update all projects with the correct board order
        const updatePromises = boardOrderUpdates.map(({ status, boardOrder }) => {
            return prisma.project.updateMany({
                where: { status },
                data: { boardOrder }
            })
        })

        await Promise.all(updatePromises)

        console.log('Board order migration completed successfully')
        
        return NextResponse.json({ 
            success: true, 
            message: 'Board order migration completed successfully',
            updatedBoards: boardOrderUpdates.length
        })
    } catch (error) {
        console.error('Error migrating board order:', error)
        return NextResponse.json({ error: 'Failed to migrate board order' }, { status: 500 })
    }
}
