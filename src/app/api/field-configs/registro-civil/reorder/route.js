import { prisma } from '@/lib/prisma'

export async function PUT(request) {
    try {
        const { fieldOrders } = await request.json()

        if (!Array.isArray(fieldOrders)) {
            return Response.json(
                { error: 'Field orders must be an array' },
                { status: 400 }
            )
        }

        // Update field orders
        for (const fieldOrder of fieldOrders) {
            await prisma.fieldConfig.update({
                where: {
                    id: fieldOrder.id,
                    projectType: 'registro-civil'
                },
                data: {
                    order: fieldOrder.order
                }
            })
        }

        return Response.json({ message: 'Field order updated successfully' })
    } catch (error) {
        console.error('Error updating field order:', error)
        return Response.json(
            { error: 'Failed to update field order' },
            { status: 500 }
        )
    }
}

