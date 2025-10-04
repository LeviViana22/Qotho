const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedRegistroCivil() {
    try {
        console.log('Seeding Registro Civil data...')

        // Create some field configurations for Registro Civil
        const fieldConfigs = [
            {
                nome: 'Nome do Requerente',
                tipo: 'text',
                obrigatorio: true,
                pesquisavel: true,
                ativo: true,
                visivelNoQuadro: true,
                fieldName: 'nomeRequerente',
                options: null,
                order: 1,
                projectType: 'registro-civil'
            },
            {
                nome: 'Tipo de Documento',
                tipo: 'dropdown',
                obrigatorio: true,
                pesquisavel: true,
                ativo: true,
                visivelNoQuadro: true,
                fieldName: 'tipoDocumento',
                options: JSON.stringify([
                    { value: 'CERTIDAO_NASCIMENTO', label: 'Certidão de Nascimento' },
                    { value: 'CERTIDAO_CASAMENTO', label: 'Certidão de Casamento' },
                    { value: 'CERTIDAO_OBITO', label: 'Certidão de Óbito' },
                    { value: 'CERTIDAO_UNIAO_ESTAVEL', label: 'Certidão de União Estável' }
                ]),
                order: 2,
                projectType: 'registro-civil'
            },
            {
                nome: 'Data de Solicitação',
                tipo: 'date',
                obrigatorio: true,
                pesquisavel: true,
                ativo: true,
                visivelNoQuadro: true,
                fieldName: 'dataSolicitacao',
                options: null,
                order: 3,
                projectType: 'registro-civil'
            },
            {
                nome: 'Status do Processo',
                tipo: 'dropdown',
                obrigatorio: true,
                pesquisavel: true,
                ativo: true,
                visivelNoQuadro: true,
                fieldName: 'statusProcesso',
                options: JSON.stringify([
                    { value: 'PENDENTE', label: 'Pendente' },
                    { value: 'EM_ANALISE', label: 'Em Análise' },
                    { value: 'APROVADO', label: 'Aprovado' },
                    { value: 'REJEITADO', label: 'Rejeitado' }
                ]),
                order: 4,
                projectType: 'registro-civil'
            }
        ]

        // Create field configurations
        for (const config of fieldConfigs) {
            await prisma.fieldConfig.create({
                data: config
            })
        }

        // Create some board colors for Registro Civil
        const boardColors = [
            {
                boardName: 'Triagem de Documentos',
                color: 'blue',
                projectType: 'registro-civil'
            },
            {
                boardName: 'Análise Técnica',
                color: 'yellow',
                projectType: 'registro-civil'
            },
            {
                boardName: 'Aprovação',
                color: 'green',
                projectType: 'registro-civil'
            },
            {
                boardName: 'Concluídas',
                color: 'gray',
                projectType: 'registro-civil'
            },
            {
                boardName: 'Canceladas',
                color: 'red',
                projectType: 'registro-civil'
            }
        ]

        // Create board colors
        for (const color of boardColors) {
            await prisma.boardColor.create({
                data: color
            })
        }

        console.log('Registro Civil data seeded successfully!')
    } catch (error) {
        console.error('Error seeding Registro Civil data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

seedRegistroCivil()

