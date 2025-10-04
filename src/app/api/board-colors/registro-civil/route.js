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
                projectType: 'registro-civil'
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

        // First, try to find existing board color
        const existingBoardColor = await prisma.boardColor.findUnique({
            where: { boardName }
        })

        let boardColor
        if (existingBoardColor) {
            // Update existing board color
            boardColor = await prisma.boardColor.update({
                where: { boardName },
                data: { 
                    color,
                    projectType: 'registro-civil'
                }
            })
        } else {
            // Create new board color
            boardColor = await prisma.boardColor.create({
                data: { 
                    boardName, 
                    projectType: 'registro-civil',
                    color 
                }
            })
        }

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
                where: { 
                    boardName: oldBoardName,
                    projectType: 'registro-civil'
                },
                data: { boardName: newBoardName }
            })
        }

        // Update the color if provided
        if (color) {
            const existingBoardColor = await prisma.boardColor.findUnique({
                where: { boardName: newBoardName }
            })

            if (existingBoardColor) {
                await prisma.boardColor.update({
                    where: { boardName: newBoardName },
                    data: { 
                        color,
                        projectType: 'registro-civil'
                    }
                })
            } else {
                await prisma.boardColor.create({
                    data: { 
                        boardName: newBoardName, 
                        projectType: 'registro-civil',
                        color 
                    }
                })
            }
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

