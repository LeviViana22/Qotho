import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { fieldOrders } = await request.json() // Array of { id, order }

        // Update all field orders in a transaction
        const updatePromises = fieldOrders.map(({ id, order }) =>
            prisma.fieldConfig.update({
                where: { id },
                data: { order }
            })
        )

        await Promise.all(updatePromises)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error reordering field configurations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
