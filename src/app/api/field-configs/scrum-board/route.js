import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get field configurations for scrum-board only
        const fieldConfigs = await prisma.fieldConfig.findMany({
            where: {
                projectType: 'scrum-board'
            },
            orderBy: { order: 'asc' }
        })

        // Parse options JSON for each field
        const parsedConfigs = fieldConfigs.map(field => ({
            ...field,
            options: field.options ? JSON.parse(field.options) : []
        }))

        return NextResponse.json({ fieldConfigs: parsedConfigs })
    } catch (error) {
        console.error('Error fetching scrum-board field configurations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { nome, tipo, obrigatorio, pesquisavel, ativo, visivelNoQuadro, fieldName, options, order } = await request.json()

        // Create new field configuration for scrum-board
        const newField = await prisma.fieldConfig.create({
            data: {
                nome,
                tipo,
                obrigatorio: obrigatorio || false,
                pesquisavel: pesquisavel || false,
                ativo: ativo !== false,
                visivelNoQuadro: visivelNoQuadro || false,
                fieldName,
                options: options ? JSON.stringify(options) : null,
                order: order || 0,
                projectType: 'scrum-board'
            }
        })

        // Parse options for response
        const parsedField = {
            ...newField,
            options: newField.options ? JSON.parse(newField.options) : []
        }

        return NextResponse.json({ fieldConfig: parsedField })
    } catch (error) {
        console.error('Error creating scrum-board field configuration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
