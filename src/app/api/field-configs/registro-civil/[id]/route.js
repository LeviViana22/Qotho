import { prisma } from '@/lib/prisma'

export async function PUT(request, { params }) {
    try {
        const { id } = await params
        const updateData = await request.json()

        const fieldConfig = await prisma.fieldConfig.update({
            where: {
                id: id,
                projectType: 'registro-civil'
            },
            data: updateData
        })

        return Response.json({ fieldConfig })
    } catch (error) {
        console.error('Error updating field config:', error)
        return Response.json(
            { error: 'Failed to update field config' },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params

        await prisma.fieldConfig.delete({
            where: {
                id: id,
                projectType: 'registro-civil'
            }
        })

        return Response.json({ message: 'Field config deleted successfully' })
    } catch (error) {
        console.error('Error deleting field config:', error)
        return Response.json(
            { error: 'Failed to delete field config' },
            { status: 500 }
        )
    }
}

