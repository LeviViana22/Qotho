'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Loading from '@/components/shared/Loading'
import { COLORS } from '@/constants/chart.constant'
import { TbFileText, TbFiles } from 'react-icons/tb'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/shared/Chart'), {
    ssr: false,
    loading: () => (
        <div className="h-[280px] flex items-center justify-center">
            <Loading loading />
        </div>
    ),
})

const Tipos = ({ refreshKey = 0 }) => {
    const [chartData, setChartData] = useState({
        series: [],
        labels: [],
        percentage: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const calculateTiposData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            // Fetch data from API
            const response = await fetch('/api/projects/scrum-board')
            
            if (!response.ok) {
                throw new Error('Failed to fetch scrum board data')
            }
            
            const data = await response.json()
            const boards = data.boards || data // Handle both new and old API response formats
            
            // Count projects by tipo field
            const tipoCounts = {}
            let totalProjects = 0
            
            // Process all boards
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    board.forEach(project => {
                        // Skip placeholder projects and only process real projects
                        if (project && project.id && !project.name?.startsWith('Board: ')) {
                            const tipo = project.tipo || 'Não definido'
                            tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1
                            totalProjects++
                        }
                    })
                }
            })
            
            // Convert to chart data
            const labels = Object.keys(tipoCounts)
            const series = Object.values(tipoCounts)
            const percentage = series.map(count => 
                totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0
            )
            
            setChartData({
                series,
                labels,
                percentage
            })
            
        } catch (error) {
            console.error('Error calculating tipos data:', error)
            setError(error.message)
            setChartData({
                series: [],
                labels: [],
                percentage: []
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        calculateTiposData()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            calculateTiposData()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [refreshKey]) // Re-run when refreshKey changes (global refresh)

    const getIconForTipo = (tipo, index) => {
        // You can customize icons based on tipo values
        if (tipo.toLowerCase().includes('alpha')) {
            return <TbFileText />
        }
        return <TbFiles />
    }

    const getColorForIndex = (index) => {
        const colors = [COLORS[0], COLORS[7], COLORS[8], COLORS[1], COLORS[2], COLORS[3]]
        return colors[index % colors.length]
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Tipos</h4>
            </div>
            <div className="mt-6">
                {isLoading ? (
                    <div className="h-[280px] flex items-center justify-center">
                        <Loading loading />
                    </div>
                ) : error ? (
                    <div className="h-[280px] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-red-500 mb-2">Erro ao carregar dados</p>
                            <p className="text-sm text-gray-500">{error}</p>
                        </div>
                    </div>
                ) : chartData.series.length > 0 ? (
                    <>
                        <Chart
                            height={105}
                            series={chartData.series}
                            customOptions={{
                                colors: chartData.labels.map((_, index) => getColorForIndex(index)),
                                labels: chartData.labels,
                                plotOptions: {
                                    pie: {
                                        donut: {
                                            labels: {
                                                show: true,
                                                total: {
                                                    show: true,
                                                    showAlways: true,
                                                    label: '',
                                                    formatter: function () {
                                                        return ''
                                                    },
                                                },
                                            },
                                            size: '75%',
                                        },
                                    },
                                },
                            }}
                            type="donut"
                        />
                        <div className="mt-8 flex justify-center gap-8 mx-auto flex-wrap">
                            {chartData.labels.map((tipo, index) => (
                                <div key={tipo} className="flex flex-col items-center justify-center gap-2">
                                    <div className="text-3xl" style={{ color: getColorForIndex(index) }}>
                                        {getIconForTipo(tipo, index)}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm">{tipo}</span>
                                        <h5 className="font-bold">{chartData.percentage[index]}%</h5>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-[280px] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500">Nenhum dado disponível</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default Tipos
