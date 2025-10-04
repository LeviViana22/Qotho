'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import ScrollBar from '@/components/ui/ScrollBar'
import Timeline from '@/components/ui/Timeline'
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import Loading from '@/components/shared/Loading'
import isEmpty from 'lodash/isEmpty'
import dayjs from 'dayjs'

const RecentActivity = ({ refreshKey = 0 }) => {
    const [activities, setActivities] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const collectAllActivities = async () => {
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
            
            let allActivities = []
            
            // Process all boards
            Object.entries(boards).forEach(([boardName, board]) => {
                if (Array.isArray(board)) {
                    board.forEach(project => {
                        // Skip placeholder projects and only process real projects
                        if (project && project.id && !project.name?.startsWith('Board: ')) {
                            if (project.activity && Array.isArray(project.activity)) {
                                project.activity.forEach(activity => {
                                    allActivities.push({
                                        ...activity,
                                        projectId: project.id,
                                        projectTitle: project.title || project.name || 'Untitled Project',
                                        projectBoard: boardName
                                    })
                                })
                            }
                        }
                    })
                }
            })
            
            // Sort by timestamp (newest first) - this puts newest at the top
            allActivities.sort((a, b) => {
                const timeA = a.dateTime || a.timestamp || a.createdAt || 0
                const timeB = b.dateTime || b.timestamp || b.createdAt || 0
                // Convert to milliseconds if it's a Unix timestamp (seconds)
                const timeAMs = timeA > 1000000000000 ? timeA : timeA * 1000
                const timeBMs = timeB > 1000000000000 ? timeB : timeB * 1000
                return timeBMs - timeAMs // Newest first
            })
            
            setActivities(allActivities)
            
        } catch (error) {
            console.error('RecentActivity: Error collecting activities:', error)
            setError(error.message)
            setActivities([])
        } finally {
            setIsLoading(false)
        }
    }

    // Initial load and refresh
    useEffect(() => {
        collectAllActivities()

        // Set up interval to refresh data periodically (every 2 minutes)
        const interval = setInterval(() => {
            collectAllActivities()
        }, 120000)

        return () => {
            clearInterval(interval)
        }
    }, [refreshKey]) // Re-run when refreshKey changes (global refresh)

    return (
        <Card>
            <div className="flex sm:flex-row flex-col md:items-center justify-between mb-6 gap-4">
                <h4>Atividades Recentes</h4>
            </div>
            <div className="mt-4 lg:min-h-[513px]">
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
                        <Timeline>
                            {isEmpty(activities) ? (
                                <Timeline.Item>
                                    <div className="flex items-center justify-center py-8 text-gray-500">
                                        Nenhuma atividade encontrada
                                    </div>
                                </Timeline.Item>
                            ) : (
                                activities.map((event, index) => (
                                    <Timeline.Item
                                        key={`${event.projectId}-${event.type}-${index}`}
                                        media={<ActivityAvatar data={event} />}
                                    >
                                        <div className="mt-1">
                                            <ActivityEvent compact data={event} />
                                            <div className="text-xs text-gray-500 mt-1">
                                                {event.projectTitle} • {event.projectBoard}
                                            </div>
                                        </div>
                                    </Timeline.Item>
                                ))
                            )}
                        </Timeline>
                    </ScrollBar>
                )}
            </div>
        </Card>
    )
}

export default RecentActivity
