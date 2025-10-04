import { NextResponse } from 'next/server'
import getScrumboardData from '../../../../server/actions/getScrumboardData'
import { getSharedData, setSharedData } from '../shared-data'

export async function GET() {
    try {
        // Retorna os dados modificados se existirem, caso contrário retorna os dados originais
        const data = getSharedData() || await getScrumboardData()
        return NextResponse.json(data)
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const data = await request.json()
        // Armazena os dados modificados na variável global compartilhada
        setSharedData(data)
        console.log('Dados das tasks atualizados com sucesso:', data)
        return NextResponse.json({ success: true, message: 'Dados atualizados com sucesso' })
    } catch (error) {
        console.log('Erro ao atualizar dados das tasks:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}