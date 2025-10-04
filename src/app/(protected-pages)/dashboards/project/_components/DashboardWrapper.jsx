'use client'
import { useState, useCallback } from 'react'
import ProjectOverview from './ProjectOverview'
import TaskOverview from './TaskOverview'
import Tipos from './Tipos'
import ProjectRevenue from './ProjectRevenue'
import CurrentTasks from './CurrentTasks'
import RecentActivity from './RecentActivity'
import BoardPerformance from './BoardPerformance'

const DashboardWrapper = ({ data }) => {
    const [refreshKey, setRefreshKey] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefreshAll = useCallback(async () => {
        setIsRefreshing(true)
        // Trigger a re-render of all components by updating the refresh key
        setRefreshKey(prev => prev + 1)
        
        // Add a small delay to show the loading state
        setTimeout(() => {
            setIsRefreshing(false)
        }, 1000)
    }, [])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex flex-col gap-4 flex-1 xl:max-w-[calc(100%-350px)]">
                    <ProjectOverview 
                        data={data.projectOverview} 
                        onRefreshAll={handleRefreshAll}
                        refreshKey={refreshKey}
                    />
                    <TaskOverview data={data.taskOverview} refreshKey={refreshKey} />
                </div>
                <div className="flex flex-col gap-4">
                    <Tipos refreshKey={refreshKey} />
                    <ProjectRevenue refreshKey={refreshKey} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="md:col-span-1 xl:col-span-1 order-1">
                    <CurrentTasks refreshKey={refreshKey} />
                </div>
                <div className="md:col-span-1 xl:col-span-1 order-2">
                    <RecentActivity refreshKey={refreshKey} />
                </div>
                <div className="md:col-span-1 xl:col-span-1 order-3">
                    <BoardPerformance refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    )
}

export default DashboardWrapper
