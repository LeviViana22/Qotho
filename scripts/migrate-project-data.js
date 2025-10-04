const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateProjectData() {
    try {
        console.log('Starting migration of project data...')

        // First, let's get all existing projects
        const existingProjects = await prisma.$queryRaw`
            SELECT * FROM projects
        `

        console.log(`Found ${existingProjects.length} existing projects`)

        // For each project, we need to:
        // 1. Extract the hardcoded field values
        // 2. Create a fieldConfiguration JSON with those values
        // 3. Set the projectType based on the field values

        for (const project of existingProjects) {
            console.log(`Migrating project: ${project.name}`)

            // Determine project type based on existing fields
            let projectType = 'scrum-board' // default
            if (project.empreendimento || project.unidade || project.matricula || 
                project.ordem || project.tipo || project.natureza || 
                project.custas || project.vencimentoMatricula || 
                project.envioEscritura || project.minutaAprovada) {
                projectType = 'escrituras'
            }

            // Create fieldConfiguration JSON with existing field values
            const fieldConfiguration = {}
            
            if (project.empreendimento) fieldConfiguration.empreendimento = project.empreendimento
            if (project.unidade) fieldConfiguration.unidade = project.unidade
            if (project.matricula) fieldConfiguration.matricula = project.matricula
            if (project.ordem) fieldConfiguration.ordem = project.ordem
            if (project.tipo) fieldConfiguration.tipo = project.tipo
            if (project.natureza) fieldConfiguration.natureza = project.natureza
            if (project.custas) fieldConfiguration.custas = project.custas
            if (project.vencimentoMatricula) fieldConfiguration.vencimentoMatricula = project.vencimentoMatricula
            if (project.envioEscritura) fieldConfiguration.envioEscritura = project.envioEscritura
            if (project.minutaAprovada !== null) fieldConfiguration.minutaAprovada = project.minutaAprovada

            // Update the project with the new structure
            await prisma.$executeRaw`
                UPDATE projects 
                SET 
                    "projectType" = ${projectType},
                    "fieldConfiguration" = ${JSON.stringify(fieldConfiguration)}
                WHERE id = ${project.id}
            `

            console.log(`✓ Migrated project ${project.name} to ${projectType}`)
        }

        console.log('Migration completed successfully!')
    } catch (error) {
        console.error('Error during migration:', error)
    } finally {
        await prisma.$disconnect()
    }
}

migrateProjectData()

