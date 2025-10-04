'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import ScrollBar from '@/components/ui/ScrollBar'
import Loading from '@/components/shared/Loading'
import classNames from '@/utils/classNames'
import { COLORS } from '@/constants/chart.constant'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/shared/Chart'), {
    ssr: false,
    loading: () => (
        <div className="h-[250px] flex items-center justify-center">
            <Loading loading />
        </div>
    ),
})

const BoardPerformance = ({ refreshKey = 0 }) => {
    const [boardData, setBoardData] = useState({
        categories: [],
        series: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const calculateBoardPercentages = async () => {
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
            const boardOrder = data.boardOrder || Object.keys(boards) // Get ordered board names
            
            // Filter out finalized boards and get only active boards in the correct order
            const activeBoards = boardOrder.filter(boardName => 
                boardName !== 'Concluídas' && 
                boardName !== 'Canceladas' && 
                boardName !== 'undefined'
            )

            let allProjects = []
            let boardCounts = {}

            // Initialize all active boards with 0 count
            activeBoards.forEach(boardName => {
                boardCounts[boardName] = 0
            })

            // Process all boards to count projects
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    board.forEach(project => {
                        // Skip placeholder projects and only count real projects
                        if (project && project.id && !project.name?.startsWith('Board: ')) {
                            allProjects.push(project)
                            
                            // Only count projects in active boards (not finalized ones)
                            if (activeBoards.includes(boardName)) {
                                boardCounts[boardName] = (boardCounts[boardName] || 0) + 1
                            }
                        }
                    })
                }
            })

            // Calculate total projects in active boards only
            const totalActiveProjects = activeBoards.reduce((total, boardName) => {
                return total + (boardCounts[boardName] || 0)
            }, 0)

            // Calculate percentages for each active board
            const categories = activeBoards
            const series = categories.map(boardName => {
                const count = boardCounts[boardName] || 0
                return totalActiveProjects > 0 ? Math.round((count / totalActiveProjects) * 100) : 0
            })

            setBoardData({ categories, series })
        } catch (error) {
            console.error('Error calculating board percentages:', error)
            setError(error.message)
            setBoardData({ categories: [], series: [] })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Calculate percentages on first load
        calculateBoardPercentages()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            calculateBoardPercentages()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [refreshKey]) // Re-run when refreshKey changes (global refresh)



    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Divisão de Quadros</h4>
            </div>
            <div className="mt-4 lg:min-h-[520px]">
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
                ) : boardData.categories.length > 0 ? (
                    <ScrollBar className="max-h-[500px]">
                        <div className="min-h-[180px]">
                            <Chart
                                type="radar"
                                customOptions={{
                                    xaxis: {
                                        categories: boardData.categories,
                                        labels: {
                                            formatter: (val) => {
                                                return `${boardData.categories.indexOf(val) + 1}`
                                            },
                                        },
                                    },
                                    yaxis: {
                                        show: false,
                                    },
                                    tooltip: {
                                        custom: function ({ dataPointIndex }) {
                                            return `
                                                <div class="py-2 px-4 rounded-xl">
                                                    <div class="flex items-center gap-2">
                                                        <div class="h-[10px] w-[10px] rounded-full" style="background-color: ${COLORS[0]}"></div>
                                                        <div class="flex gap-2">${boardData.categories[dataPointIndex]}: <span class="font-bold">${boardData.series[dataPointIndex]}%</span></div>
                                                    </div>
                                                </div>
                                            `
                                        },
                                    },
                                }}
                                series={[
                                    {
                                        name: 'Board Performance',
                                        data: boardData.series,
                                    },
                                ]}
                                height={180}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            {boardData.categories.map((board, index) => (
                                <div
                                    key={board + index}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-600 font-bold heading-text flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        <div className="heading-text">{board}</div>
                                    </div>
                                    <div className="border-dashed border-[1.5px] border-gray-300 dark:border-gray-500 flex-1" />
                                    <div>
                                        <span
                                            className={classNames(
                                                'rounded-full px-2 py-1 text-white',
                                                boardData.series[index] > 75 && 'bg-success',
                                                boardData.series[index] <= 30 && 'bg-error',
                                                boardData.series[index] > 30 &&
                                                    boardData.series[index] < 75 &&
                                                    'bg-warning',
                                            )}
                                        >
                                            {boardData.series[index]}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollBar>
                ) : (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500">Nenhum dado disponível</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default BoardPerformance 