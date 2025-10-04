import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const fieldConfigs = await prisma.fieldConfig.findMany({
            where: {
                projectType: 'registro-civil'
            },
            orderBy: {
                order: 'asc'
            }
        })

        // Parse options JSON for each field
        const parsedConfigs = fieldConfigs.map(field => ({
            ...field,
            options: field.options ? JSON.parse(field.options) : []
        }))

        return Response.json({ fieldConfigs: parsedConfigs })
    } catch (error) {
        console.error('Error fetching field configs:', error)
        return Response.json(
            { error: 'Failed to fetch field configs' },
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const fieldData = await request.json()

        const fieldConfig = await prisma.fieldConfig.create({
            data: {
                ...fieldData,
                projectType: 'registro-civil'
            }
        })

        // Parse options for response
        const parsedField = {
            ...fieldConfig,
            options: fieldConfig.options ? JSON.parse(fieldConfig.options) : []
        }

        return Response.json({ fieldConfig: parsedField })
    } catch (error) {
        console.error('Error creating field config:', error)
        return Response.json(
            { error: 'Failed to create field config' },
            { status: 500 }
        )
    }
}

