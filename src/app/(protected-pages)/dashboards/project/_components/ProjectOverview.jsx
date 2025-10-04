'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import classNames from '@/utils/classNames'
import Link from 'next/link'
import { TbProgressBolt, TbCopyCheck, TbArrowDownToArc, TbRefresh, TbProgressX, TbProgressCheck } from 'react-icons/tb'

const StatisticCard = ({ title, className, icon, value, isLoading, error }) => {
    return (
        <div
            className={classNames(
                'rounded-2xl p-4 flex flex-col justify-center',
                className,
            )}
        >
            <div className="flex justify-between items-center relative">
                <div>
                    <div className="mb-4 text-gray-900 font-bold">{title}</div>
                    <h1 className="mb-1 text-gray-900">
                        {isLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : error ? (
                            <span className="text-red-500">Erro</span>
                        ) : (
                            value
                        )}
                    </h1>
                </div>
                <div
                    className={
                        'flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 bg-gray-900 text-white rounded-full text-2xl'
                    }
                >
                    {icon}
                </div>
            </div>
        </div>
    )
}

const ProjectOverview = ({ data, onRefreshAll, refreshKey = 0 }) => {
    const [projectCounts, setProjectCounts] = useState({
        ongoingProject: 0,
        projectCompleted: 0,
        upcomingProject: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)



    const calculateProjectCounts = async () => {
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
            
            let ongoingCount = 0
            let completedCount = 0
            let cancelledCount = 0

            // Track all unique project IDs and their locations (for ongoing projects only)
            const projectLocations = new Map() // id -> boardName

            // Process all boards
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    if (boardName === 'Concluídas') {
                        // Count completed projects
                        completedCount = board.length
                    } else if (boardName === 'Canceladas') {
                        // Count cancelled projects
                        cancelledCount = board.length
                    } else {
                        // Count ongoing projects (all boards except finalized ones)
                        board.forEach(project => {
                            if (project && project.id) {
                                // Check if this project is already tracked
                                if (projectLocations.has(project.id)) {
                                    console.warn(`ProjectOverview - DUPLICATE PROJECT FOUND: ${project.id} (${project.name}) in both "${projectLocations.get(project.id)}" and "${boardName}"`)
                                } else {
                                    projectLocations.set(project.id, boardName)
                                }
                            }
                        })
                    }
                }
            })

            // Count ongoing projects
            ongoingCount = projectLocations.size

            setProjectCounts({
                ongoingProject: ongoingCount,
                projectCompleted: completedCount,
                upcomingProject: cancelledCount
            })
        } catch (error) {
            console.error('Error calculating project counts:', error)
            setError(error.message)
            // Don't fallback to mock data - show 0 when there's an error
            setProjectCounts({
                ongoingProject: 0,
                projectCompleted: 0,
                upcomingProject: 0
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Calculate counts on first load
        calculateProjectCounts()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            calculateProjectCounts()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [data, refreshKey])

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Visão Geral</h4>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={onRefreshAll}
                        disabled={isLoading}
                    >
                        <TbRefresh className={isLoading ? 'animate-spin' : ''} />
                        {isLoading ? '...' : ''}
                    </Button>
                    <Link href="/concepts/projects/scrum-board">
                        <Button asElement="div" size="sm">
                            Todos os projetos
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl mt-4">
                <StatisticCard
                    title="Escrituras em andamento"
                    className="bg-sky-100 dark:bg-opacity-75"
                    value={projectCounts.ongoingProject}
                    icon={<TbProgressBolt />}
                    isLoading={isLoading}
                    error={error}
                />
                <StatisticCard
                    title="Escrituras concluídas"
                    className="bg-emerald-100 dark:bg-opacity-75"
                    value={projectCounts.projectCompleted}
                    icon={<TbProgressCheck />}
                    isLoading={isLoading}
                    error={error}
                />
                <StatisticCard
                    title="Escrituras canceladas"
                    className="bg-red-100 dark:bg-opacity-75"
                    value={projectCounts.upcomingProject}
                    icon={<TbProgressX />}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </Card>
    )
}

export default ProjectOverview
