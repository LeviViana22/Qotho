'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import { PiProjectorScreenChartDuotone } from 'react-icons/pi'
import dayjs from 'dayjs'
import Link from 'next/link'
import ScrollBar from '@/components/ui/ScrollBar'
import Loading from '@/components/shared/Loading'

export const labelClass = {
    'In Progress': 'bg-sky-200 dark:bg-sky-200 dark:text-gray-900',
    Completed: 'bg-emerald-200 dark:bg-emerald-200 dark:text-gray-900',
    Pending: 'bg-amber-200 dark:bg-amber-200 dark:text-gray-900',
    High: 'bg-red-200 dark:bg-red-200 dark:text-gray-900',
    Medium: 'bg-orange-200 dark:bg-orange-200 dark:text-gray-900',
    Low: 'bg-purple-200 dark:bg-purple-200 dark:text-gray-900',
}

const CurrentTasks = ({ refreshKey = 0 }) => {
    const [tasks, setTasks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const collectLatestProjects = async () => {
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
            
            let allProjects = []
            const seenProjectIds = new Set() // Track seen project IDs to avoid duplicates
            
            // Process all boards
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    board.forEach(project => {
                        // Skip placeholder projects and only process real projects
                        if (project && project.id && !project.name?.startsWith('Board: ')) {
                            if (!seenProjectIds.has(project.id)) {
                                seenProjectIds.add(project.id)
                                allProjects.push({
                                    ...project,
                                    boardName
                                })
                            }
                        }
                    })
                }
            })
            
            // Sort by creation date (newest first) and take the latest 5
            allProjects.sort((a, b) => {
                const timeA = a.createdAt || 0
                const timeB = b.createdAt || 0
                const timeAMs = timeA > 1000000000000 ? timeA : timeA * 1000
                const timeBMs = timeB > 1000000000000 ? timeB : timeB * 1000
                return timeBMs - timeAMs // Newest first
            })
            
            // Take only the latest 5 projects
            const latestProjects = allProjects.slice(0, 5)
            
            setTasks(latestProjects)
        } catch (error) {
            console.error('Error collecting latest projects:', error)
            setError(error.message)
            setTasks([])
        } finally {
            setIsLoading(false)
        }
    }

    // Initial load and refresh
    useEffect(() => {
        collectLatestProjects()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            collectLatestProjects()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [refreshKey]) // Re-run when refreshKey changes (global refresh)

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Projetos criados</h4>
            </div>
            <div className="mt-4 lg:min-h-[521px]">
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
                ) : (
                    <ScrollBar className="max-h-[500px]">
                        {tasks.map((task, index) => (
                            <div
                                key={`${task.id}-${task.boardName}-${index}`}
                                className={classNames(
                                    'flex items-center justify-between py-4 border-gray-200 dark:border-gray-600',
                                    !isLastChild(tasks, index) && 'border-b',
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-[26px] text-gray-400">
                                        <PiProjectorScreenChartDuotone />
                                    </div>
                                    <div>
                                        <div className="heading-text font-bold mb-1">
                                            <Link 
                                                href={`/concepts/projects/tasks/${task.id}`}
                                                className="hover:text-primary cursor-pointer transition-colors"
                                            >
                                                {task.title || task.name || 'Untitled Project'}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                {(() => {
                                                    // Try multiple possible date fields
                                                    const dateValue = task.createdAt || task.entryDate || task.dateTime || task.dueDate
                                                    if (dateValue) {
                                                        try {
                                                            // Handle different date formats
                                                            let timestamp = dateValue
                                                            if (typeof dateValue === 'string') {
                                                                timestamp = new Date(dateValue).getTime()
                                                            } else if (typeof dateValue === 'number') {
                                                                // If it's a Unix timestamp in seconds, convert to milliseconds
                                                                timestamp = dateValue > 1000000000000 ? dateValue : dateValue * 1000
                                                            }
                                                            return dayjs(timestamp).format('MMMM DD')
                                                        } catch (error) {
                                                            console.error('Error formatting date:', error, dateValue)
                                                            return '-'
                                                        }
                                                    }
                                                    return '-'
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Tag className="mr-2 rtl:ml-2 mb-2 bg-blue-200 dark:bg-blue-200 dark:text-gray-900">
                                        {task.projectId || 'No ID'}
                                    </Tag>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                Nenhum projeto encontrado
                            </div>
                        )}
                    </ScrollBar>
                )}
            </div>
        </Card>
    )
}

export default CurrentTasks
