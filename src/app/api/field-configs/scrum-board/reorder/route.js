import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { fieldIds } = await request.json()
        
        if (!Array.isArray(fieldIds)) {
            return NextResponse.json({ error: 'fieldIds must be an array' }, { status: 400 })
        }

        // Update order for each field configuration for scrum-board
        const updatePromises = fieldIds.map((fieldId, index) => 
            prisma.fieldConfig.update({
                where: { 
                    id: fieldId,
                    projectType: 'scrum-board'
                },
                data: { order: index }
            })
        )

        await Promise.all(updatePromises)

        console.log('API: Scrum-board field configurations reordered successfully')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering scrum-board field configurations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
