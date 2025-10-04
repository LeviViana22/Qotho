import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
    try {
        const { boards } = await request.json()
        
        if (!boards || typeof boards !== 'object') {
            return NextResponse.json({ error: 'Invalid boards data' }, { status: 400 })
        }

        console.log('Migrating boards to database:', Object.keys(boards))

        // Clear existing projects
        await prisma.project.deleteMany({})
        console.log('Cleared existing projects')

        // Insert new projects
        const projectsToInsert = []
        
        Object.entries(boards).forEach(([boardName, tickets]) => {
            if (Array.isArray(tickets)) {
                tickets.forEach(ticket => {
                    // Create fieldConfiguration JSON with all the dynamic fields
                    const fieldConfiguration = {}
                    
                    // Add all the dynamic fields to fieldConfiguration
                    if (ticket.empreendimento) fieldConfiguration.empreendimento = ticket.empreendimento
                    if (ticket.unidade) fieldConfiguration.unidade = ticket.unidade
                    if (ticket.matricula) fieldConfiguration.matricula = ticket.matricula
                    if (ticket.ordem) fieldConfiguration.ordem = ticket.ordem
                    if (ticket.tipo) fieldConfiguration.tipo = ticket.tipo
                    if (ticket.natureza) fieldConfiguration.natureza = ticket.natureza
                    if (ticket.custas) fieldConfiguration.custas = ticket.custas
                    if (ticket.vencimentoMatricula) fieldConfiguration.vencimentoMatricula = ticket.vencimentoMatricula
                    if (ticket.envioEscritura) fieldConfiguration.envioEscritura = ticket.envioEscritura
                    if (ticket.minutaAprovada !== undefined) fieldConfiguration.minutaAprovada = ticket.minutaAprovada
                    
                    // Determine project type based on the fields
                    let projectType = 'scrum-board' // default
                    if (ticket.empreendimento || ticket.unidade || ticket.matricula || 
                        ticket.ordem || ticket.tipo || ticket.natureza || 
                        ticket.custas || ticket.vencimentoMatricula || 
                        ticket.envioEscritura || ticket.minutaAprovada) {
                        projectType = 'escrituras'
                    }
                    
                    projectsToInsert.push({
                        projectId: ticket.projectId || ticket.id,
                        name: ticket.name || ticket.title || 'Untitled Project',
                        description: ticket.description || null,
                        status: boardName,
                        members: JSON.stringify(ticket.members || []),
                        labels: ticket.labels ? JSON.stringify(ticket.labels) : null,
                        attachments: ticket.attachments ? JSON.stringify(ticket.attachments) : null,
                        comments: ticket.comments ? JSON.stringify(ticket.comments) : null,
                        activity: ticket.activity ? JSON.stringify(ticket.activity) : null,
                        dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
                        assignedTo: ticket.assignedTo || null,
                        label: ticket.label || null,
                        pendingItems: ticket.pendingItems ? JSON.stringify(ticket.pendingItems) : null,
                        fieldConfiguration: JSON.stringify(fieldConfiguration),
                        projectType: projectType,
                    })
                })
            }
        })

        if (projectsToInsert.length > 0) {
            await prisma.project.createMany({
                data: projectsToInsert
            })
            console.log(`Inserted ${projectsToInsert.length} projects`)
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully migrated ${projectsToInsert.length} projects to database`,
            boardsCount: Object.keys(boards).length
        })

    } catch (error) {
        console.error('Error migrating boards:', error)
        return NextResponse.json({ error: 'Failed to migrate boards' }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
