import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { oldBoardName, newBoardName } = await request.json()

        if (!oldBoardName || !newBoardName) {
            return NextResponse.json({ error: 'Old and new board names are required' }, { status: 400 })
        }

        if (oldBoardName === newBoardName) {
            return NextResponse.json({ error: 'Old and new board names cannot be the same' }, { status: 400 })
        }

        // Prevent renaming of special finalized boards
        if (oldBoardName === 'Concluídas' || oldBoardName === 'Canceladas') {
            return NextResponse.json({ error: 'Cannot rename finalized boards (Concluídas/Canceladas)' }, { status: 400 })
        }

        // Prevent creating boards with special finalized board names
        if (newBoardName === 'Concluídas' || newBoardName === 'Canceladas') {
            return NextResponse.json({ error: 'Cannot use reserved board names (Concluídas/Canceladas)' }, { status: 400 })
        }

        // Check if the new board name already exists
        const existingBoard = await prisma.project.findFirst({
            where: { status: newBoardName }
        })

        if (existingBoard) {
            return NextResponse.json({ error: 'A board with this name already exists' }, { status: 409 })
        }

        // Get all projects in the old board to preserve their order
        const projectsInOldBoard = await prisma.project.findMany({
            where: { status: oldBoardName },
            orderBy: { boardOrder: 'asc' }
        })

        if (projectsInOldBoard.length === 0) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 })
        }

        // Update all projects in the old board to have the new status
        const updateResult = await prisma.project.updateMany({
            where: { status: oldBoardName },
            data: { 
                status: newBoardName,
                updatedAt: new Date()
            }
        })

        // Update board colors if they exist
        try {
            await prisma.boardColor.updateMany({
                where: { boardName: oldBoardName },
                data: { boardName: newBoardName }
            })
        } catch (error) {
            // Board colors might not exist, that's okay
            console.log('No board colors to update for board:', oldBoardName)
        }

        console.log(`Board renamed from "${oldBoardName}" to "${newBoardName}". Updated ${updateResult.count} projects.`)
        
        return NextResponse.json({ 
            success: true, 
            message: `Board renamed from "${oldBoardName}" to "${newBoardName}"`,
            updatedProjectsCount: updateResult.count,
            oldBoardName,
            newBoardName
        })
    } catch (error) {
        console.error('Error renaming board:', error)
        return NextResponse.json({ error: 'Failed to rename board' }, { status: 500 })
    }
}
