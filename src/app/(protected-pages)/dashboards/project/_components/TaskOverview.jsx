'use client'
import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Segment from '@/components/ui/Segment'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/shared/Loading'
import { COLORS } from '@/constants/chart.constant'
import isEmpty from 'lodash/isEmpty'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/shared/Chart'), {
    ssr: false,
    loading: () => {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <Loading loading />
            </div>
        )
    },
})

const ChartLegend = ({ label, value, color, showBadge = true }) => {
    return (
        <div className="flex gap-2">
            {showBadge && (
                <Badge className="mt-2.5" style={{ backgroundColor: color }} />
            )}
            <div>
                <h5 className="font-bold">{value}</h5>
                <p>{label}</p>
            </div>
        </div>
    )
}

const TaskOverview = ({ data, refreshKey = 0 }) => {
    const [timeRange, setTimeRange] = useState('weekly')
    const [chartData, setChartData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const calculateProjectData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            // Fetch data from API instead of localStorage
            const response = await fetch('/api/projects/scrum-board')
            
            if (!response.ok) {
                throw new Error('Failed to fetch scrum board data')
            }
            
            const data = await response.json()
            const boards = data.boards || data // Handle both new and old API response formats
            
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            let createdProjects = []
            let completedProjects = []

            // Process all boards for created and completed projects
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    board.forEach(project => {
                        if (project && project.id) {
                            // All projects have a createdAt date
                            const createdDate = project.createdAt ? new Date(project.createdAt) : new Date()
                            createdProjects.push({ ...project, createdDate })
                            
                            // Check if this is a completed project (in Concluídas board)
                            if (boardName === 'Concluídas') {
                                // For completed projects, use updatedAt as completion date if no completedAt
                                const completedDate = project.completedAt ? new Date(project.completedAt) : 
                                                    project.updatedAt ? new Date(project.updatedAt) : 
                                                    new Date()
                                completedProjects.push({ ...project, completedDate })
                            }
                        }
                    })
                }
            })

            // Filter projects based on time range
            const filterByDateRange = (projects, dateField, startDate) => {
                return projects.filter(project => {
                    const projectDate = new Date(project[dateField])
                    return projectDate >= startDate
                })
            }

            let filteredCreated = []
            let filteredCompleted = []
            let xAxis = []
            let series = []

            if (timeRange === 'weekly') {
                const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
                xAxis = weekDays
                const weekData = weekDays.map((day, index) => {
                    const dayStart = new Date(weekStart)
                    dayStart.setDate(weekStart.getDate() + index)
                    const dayEnd = new Date(dayStart)
                    dayEnd.setDate(dayStart.getDate() + 1)
                    
                    const dayCreated = createdProjects.filter(project => {
                        const createdDate = new Date(project.createdDate)
                        return createdDate >= dayStart && createdDate < dayEnd
                    }).length
                    
                    const dayCompleted = completedProjects.filter(project => {
                        const completedDate = new Date(project.completedDate)
                        return completedDate >= dayStart && completedDate < dayEnd
                    }).length
                    
                    return { created: dayCreated, completed: dayCompleted }
                })
                
                series = [
                    { name: 'Created', data: weekData.map(d => d.created) },
                    { name: 'Completed', data: weekData.map(d => d.completed) }
                ]
            } else if (timeRange === 'monthly') {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                xAxis = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                const monthData = xAxis.map(day => {
                    const dayStart = new Date(now.getFullYear(), now.getMonth(), day)
                    const dayEnd = new Date(dayStart)
                    dayEnd.setDate(dayStart.getDate() + 1)
                    
                    const dayCreated = createdProjects.filter(project => {
                        const createdDate = new Date(project.createdDate)
                        return createdDate >= dayStart && createdDate < dayEnd
                    }).length
                    
                    const dayCompleted = completedProjects.filter(project => {
                        const completedDate = new Date(project.completedDate)
                        return completedDate >= dayStart && completedDate < dayEnd
                    }).length
                    
                    return { created: dayCreated, completed: dayCompleted }
                })
                
                series = [
                    { name: 'Created', data: monthData.map(d => d.created) },
                    { name: 'Completed', data: monthData.map(d => d.completed) }
                ]
            } else if (timeRange === 'yearly') {
                const yearStart = new Date(now.getFullYear(), 0, 1)
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                xAxis = months
                const yearData = months.map((month, index) => {
                    const monthStart = new Date(now.getFullYear(), index, 1)
                    const monthEnd = new Date(now.getFullYear(), index + 1, 1)
                    
                    const monthCreated = createdProjects.filter(project => {
                        const createdDate = new Date(project.createdDate)
                        return createdDate >= monthStart && createdDate < monthEnd
                    }).length
                    
                    const monthCompleted = completedProjects.filter(project => {
                        const completedDate = new Date(project.completedDate)
                        return completedDate >= monthStart && completedDate < monthEnd
                    }).length
                    
                    return { created: monthCreated, completed: monthCompleted }
                })
                
                series = [
                    { name: 'Created', data: yearData.map(d => d.created) },
                    { name: 'Completed', data: yearData.map(d => d.completed) }
                ]
            }

            // Calculate totals from the series data
            const totalCreated = series.length > 0 && series[0] ? series[0].data.reduce((sum, val) => sum + val, 0) : 0
            const totalCompleted = series.length > 1 && series[1] ? series[1].data.reduce((sum, val) => sum + val, 0) : 0

            // Calculate unique projects (created OR completed) for the total
            // This prevents double-counting when a project is created and then completed
            const uniqueProjectIds = new Set()
            
            // Add all created projects to the set
            createdProjects.forEach(project => {
                if (project.createdDate) {
                    const createdDate = new Date(project.createdDate)
                    if (timeRange === 'weekly' && createdDate >= weekStart) {
                        uniqueProjectIds.add(project.id)
                    } else if (timeRange === 'monthly' && createdDate >= monthStart) {
                        uniqueProjectIds.add(project.id)
                    } else if (timeRange === 'yearly' && createdDate >= new Date(now.getFullYear(), 0, 1)) {
                        uniqueProjectIds.add(project.id)
                    }
                }
            })
            
            // Add all completed projects to the set
            completedProjects.forEach(project => {
                if (project.completedDate) {
                    const completedDate = new Date(project.completedDate)
                    if (timeRange === 'weekly' && completedDate >= weekStart) {
                        uniqueProjectIds.add(project.id)
                    } else if (timeRange === 'monthly' && completedDate >= monthStart) {
                        uniqueProjectIds.add(project.id)
                    } else if (timeRange === 'yearly' && completedDate >= new Date(now.getFullYear(), 0, 1)) {
                        uniqueProjectIds.add(project.id)
                    }
                }
            })

            setChartData({
                total: uniqueProjectIds.size, // Use unique project count instead of sum
                onGoing: totalCreated,
                finished: totalCompleted,
                series,
                range: xAxis
            })
        } catch (error) {
            console.error('Error calculating project data:', error)
            setError(error.message)
            setChartData(null)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate data when component mounts or timeRange changes
    React.useEffect(() => {
        calculateProjectData()
    }, [timeRange, refreshKey])

    // Set up interval to refresh data periodically (every 2 minutes)
    React.useEffect(() => {
        const interval = setInterval(() => {
            calculateProjectData()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [timeRange])

    return (
        <Card>
            <div className="flex sm:flex-row flex-col md:items-center justify-between mb-6 gap-4">
                <h4>Gráfico de Escrituras</h4>
                <Segment
                    value={timeRange}
                    size="sm"
                    onChange={(val) => setTimeRange(val)}
                >
                    <Segment.Item value="weekly">Semanal</Segment.Item>
                    <Segment.Item value="monthly">Mensal</Segment.Item>
                    <Segment.Item value="yearly">Anual</Segment.Item>
                </Segment>
            </div>
            {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                    <Loading loading />
                </div>
            ) : error ? (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-2">Erro ao carregar dados</p>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                </div>
            ) : chartData ? (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <ChartLegend
                                showBadge={false}
                                label="Total"
                                value={chartData.total}
                            />
                        </div>
                        <div className="flex gap-x-6">
                            <ChartLegend
                                color={COLORS[7]}
                                label="Criados"
                                value={chartData.onGoing}
                            />
                            <ChartLegend
                                color={COLORS[8]}
                                label="Concluídas"
                                value={chartData.finished}
                            />
                        </div>
                    </div>
                    <div>
                        <Chart
                            series={chartData.series}
                            xAxis={chartData.range}
                            type="bar"
                            customOptions={{
                                colors: [COLORS[7], COLORS[8]],
                                legend: { show: false },
                                plotOptions: {
                                    bar: {
                                        columnWidth: '15px',
                                        borderRadius: 4,
                                        borderRadiusApplication: 'end',
                                    },
                                },
                            }}
                        />
                    </div>
                </>
            ) : (
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-500">Nenhum dado disponível</p>
                    </div>
                </div>
            )}
        </Card>
    )
}

export default TaskOverview
