'use client'
import { useState } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import TasksHeader from './TasksHeader'
import TaskList from './TaskList'
import TaskDialog from './TaskDialog'



const TasksPageWrapper = () => {
    const [columnWidths, setColumnWidths] = useState({
        'Nome do Projeto': 200,
        'Atendente': 120,
        'Data de Entrada': 100,
        'Tipo': 80,
        'E-protocolo': 120,
        'Empreendimento': 120,
        'Ordem': 80,
        'Unidade': 80,
        'Custas': 80,
        'Natureza': 80,
        'Vencimento Matrícula': 120,
        'Código de Validação ITBI': 120,
        'Envio ITBI/Escritura': 120,
        'ITBI Pago?': 120,
        'Escritura Pago?': 120,
        'Envio Minuta': 120,
        'Minuta Aprovada?': 120,
        'Data Lavratura': 120,
        'Data Envio para Registro': 120,
        'Status ONR': 120,
        'Pendências': 120
    })

    const handleColumnWidthChange = (columnName, width) => {
        setColumnWidths(prev => ({
            ...prev,
            [columnName]: width
        }))
    }

    return (
        <>
            <AdaptiveCard>
                <TasksHeader 
                    columnWidths={columnWidths}
                    onColumnWidthChange={handleColumnWidthChange}
                />
                <div className="my-8">
                    <TaskList columnWidths={columnWidths} />
                </div>
            </AdaptiveCard>
            <TaskDialog />
        </>
    )
}

export default TasksPageWrapper 