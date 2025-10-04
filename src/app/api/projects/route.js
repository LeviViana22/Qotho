import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' }
        })

        // Transform projects back to scrum board format
        const scrumBoardData = {}
        
        projects.forEach(project => {
            const boardName = project.status
            if (!scrumBoardData[boardName]) {
                scrumBoardData[boardName] = []
            }
            
            // Transform database project to scrum board format
            const transformedProject = {
                id: project.id,
                projectId: project.projectId || project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                members: project.members ? JSON.parse(project.members) : [],
                labels: project.labels ? JSON.parse(project.labels) : [],
                attachments: project.attachments ? JSON.parse(project.attachments) : [],
                comments: project.comments ? JSON.parse(project.comments) : [],
                activity: project.activity ? JSON.parse(project.activity) : [],
                dueDate: project.dueDate,
                assignedTo: project.assignedTo,
                label: project.label,
                entryDate: project.entryDate,
                empreendimento: project.empreendimento,
                unidade: project.unidade,
                matricula: project.matricula,
                ordem: project.ordem,
                tipo: project.tipo,
                natureza: project.natureza,
                custas: project.custas,
                vencimentoMatricula: project.vencimentoMatricula,
                envioEscritura: project.envioEscritura,
                minutaAprovada: project.minutaAprovada,
                pendingItems: project.pendingItems ? JSON.parse(project.pendingItems) : [],
                fieldConfiguration: project.fieldConfiguration ? JSON.parse(project.fieldConfiguration) : [],
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }
            
            scrumBoardData[boardName].push(transformedProject)
        })

        return NextResponse.json(scrumBoardData)
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const scrumBoardData = await request.json()
        
        // Clear existing projects
        await prisma.project.deleteMany({})
        
        // Insert new projects
        const projectsToInsert = []
        
        for (const [boardName, projects] of Object.entries(scrumBoardData)) {
            if (Array.isArray(projects)) {
                projects.forEach(project => {
                    projectsToInsert.push({
                        id: project.id,
                        projectId: project.projectId,
                        name: project.name,
                        description: project.description,
                        status: boardName,
                        members: JSON.stringify(project.members || []),
                        labels: JSON.stringify(project.labels || []),
                        attachments: JSON.stringify(project.attachments || []),
                        comments: JSON.stringify(project.comments || []),
                        activity: JSON.stringify(project.activity || []),
                        dueDate: project.dueDate,
                        assignedTo: project.assignedTo,
                        label: project.label,
                        entryDate: project.entryDate,
                        empreendimento: project.empreendimento,
                        unidade: project.unidade,
                        matricula: project.matricula,
                        ordem: project.ordem,
                        tipo: project.tipo,
                        natureza: project.natureza,
                        custas: project.custas,
                        vencimentoMatricula: project.vencimentoMatricula,
                        envioEscritura: project.envioEscritura,
                        minutaAprovada: project.minutaAprovada,
                        pendingItems: JSON.stringify(project.pendingItems || []),
                        fieldConfiguration: JSON.stringify(project.fieldConfiguration || []),
                        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
                        updatedAt: new Date()
                    })
                })
            }
        }
        
        if (projectsToInsert.length > 0) {
            await prisma.project.createMany({
                data: projectsToInsert
            })
        }

        return NextResponse.json({ success: true, message: 'Projects saved successfully' })
    } catch (error) {
        console.error('Error saving projects:', error)
        return NextResponse.json({ error: 'Failed to save projects' }, { status: 500 })
    }
}
