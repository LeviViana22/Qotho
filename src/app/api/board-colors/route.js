import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const boardColors = await prisma.boardColor.findMany({
            where: {
                OR: [
                    { projectType: 'escrituras' },
                    { projectType: null } // For backward compatibility with existing data
                ]
            },
            orderBy: { createdAt: 'asc' }
        })

        // Convert to object format for easier lookup
        const colorMap = {}
        boardColors.forEach(boardColor => {
            colorMap[boardColor.boardName] = boardColor.color
        })

        return NextResponse.json(colorMap)
    } catch (error) {
        console.error('Error fetching board colors:', error)
        return NextResponse.json({ error: 'Failed to fetch board colors' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { boardName, color } = await request.json()

        if (!boardName || !color) {
            return NextResponse.json({ error: 'Board name and color are required' }, { status: 400 })
        }

        // Upsert the board color (create or update)
        const boardColor = await prisma.boardColor.upsert({
            where: { boardName },
            update: { 
                color,
                projectType: 'escrituras'
            },
            create: { 
                boardName, 
                color,
                projectType: 'escrituras'
            }
        })

        return NextResponse.json({ 
            success: true, 
            boardColor,
            message: `Board color updated for "${boardName}"`
        })
    } catch (error) {
        console.error('Error saving board color:', error)
        return NextResponse.json({ error: 'Failed to save board color' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { oldBoardName, newBoardName, color } = await request.json()

        if (!oldBoardName || !newBoardName) {
            return NextResponse.json({ error: 'Old and new board names are required' }, { status: 400 })
        }

        // Update the board color when a board is renamed
        if (oldBoardName !== newBoardName) {
            await prisma.boardColor.updateMany({
                where: { boardName: oldBoardName },
                data: { boardName: newBoardName }
            })
        }

        // Update the color if provided
        if (color) {
            await prisma.boardColor.upsert({
                where: { boardName: newBoardName },
                update: { 
                    color,
                    projectType: 'escrituras'
                },
                create: { 
                    boardName: newBoardName, 
                    color,
                    projectType: 'escrituras'
                }
            })
        }

        return NextResponse.json({ 
            success: true, 
            message: `Board color updated for "${newBoardName}"`
        })
    } catch (error) {
        console.error('Error updating board color:', error)
        return NextResponse.json({ error: 'Failed to update board color' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { boardName } = await request.json()

        if (!boardName) {
            return NextResponse.json({ error: 'Board name is required' }, { status: 400 })
        }

        await prisma.boardColor.delete({
            where: { boardName }
        })

        return NextResponse.json({ 
            success: true, 
            message: `Board color deleted for "${boardName}"`
        })
    } catch (error) {
        console.error('Error deleting board color:', error)
        return NextResponse.json({ error: 'Failed to delete board color' }, { status: 500 })
    }
}
