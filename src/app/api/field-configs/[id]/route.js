import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request, { params }) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const requestBody = await request.json()
        console.log('API: Updating field', id, 'with data:', requestBody)
        
        const { nome, tipo, obrigatorio, pesquisavel, ativo, visivelNoQuadro, fieldName, options, order } = requestBody

        // Update field configuration
        const updatedField = await prisma.fieldConfig.update({
            where: { id },
            data: {
                nome,
                tipo,
                obrigatorio: obrigatorio || false,
                pesquisavel: pesquisavel || false,
                ativo: ativo !== false,
                visivelNoQuadro: visivelNoQuadro || false,
                fieldName,
                options: options ? JSON.stringify(options) : null,
                order: order || 0
            }
        })

        console.log('API: Field updated successfully:', updatedField)

        // Parse options for response
        const parsedField = {
            ...updatedField,
            options: updatedField.options ? JSON.parse(updatedField.options) : []
        }

        return NextResponse.json({ fieldConfig: parsedField })
    } catch (error) {
        console.error('Error updating field configuration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Delete field configuration
        await prisma.fieldConfig.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting field configuration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
