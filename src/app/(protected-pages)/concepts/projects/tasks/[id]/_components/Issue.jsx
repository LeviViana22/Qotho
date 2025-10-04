'use client'

import { useEffect, useState } from 'react'
import Loading from '@/components/shared/Loading'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import NotFound from '@/components/shared/NotFound'
import IssueHeader from './IssueHeader'
import IssueBody from './IssueBody'
import IssueFooter from './IssueFooter'
import IssueActivity from './IssueActivity'
import { useIssueStore } from '../_store/issueStore'
import { scrumboardData } from '@/mock/data/projectsData'
import isEmpty from 'lodash/isEmpty'

const Issue = ({ projectId }) => {
    const { issueData, updateIssueData, setInitialLoading } = useIssueStore()
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const loadProjectData = () => {
            try {
                // Get current scrumboard data (from localStorage if available, otherwise from mock data)
                let currentScrumboardData = scrumboardData
                
                try {
                    const storedData = localStorage.getItem('scrumboardData')
                    if (storedData) {
                        currentScrumboardData = JSON.parse(storedData)
                    }
                } catch (error) {
                    console.log('Using original mock data for Issue')
                }
                
                // Find the project in scrum board data by projectId or id
                for (const boardName in currentScrumboardData) {
                    const board = currentScrumboardData[boardName]
                    
                    const project = board.find(project => {
                        const matchesProjectId = project.projectId === projectId
                        const matchesId = project.id === projectId
                        return matchesProjectId || matchesId
                    })
                    
                    if (project) {
                        // Transform the project data to match the expected structure
                        const transformedProject = {
                            ...project,
                            // Map members to assignees for compatibility with IssueBody component
                            assignees: project.members || [],
                            // Ensure labels have the expected structure (id and title)
                            labels: (project.labels || []).map(label => ({
                                id: label,
                                title: label
                            })),
                            // Use board name as status
                            status: boardName,
                            // Convert dueDate to timestamp if it's a Date object
                            dueDate: project.dueDate ? (project.dueDate instanceof Date ? project.dueDate.getTime() / 1000 : project.dueDate) : null,
                            // Ensure arrays are properly initialized
                            comments: project.comments || [],
                            attachments: project.attachments || [],
                            activity: project.activity || [],
                            // Keep original members for backward compatibility
                            members: project.members || [],
                            // Ensure project name is available
                            name: project.name || project.title || 'Untitled Project'
                        }
                        
                        updateIssueData(transformedProject)
                        setLoading(false)
                        return
                    }
                }
                
                // Project not found
                setNotFound(true)
                setLoading(false)
            } catch (error) {
                console.error('Error loading project data:', error)
                setNotFound(true)
                setLoading(false)
            }
        }

        loadProjectData()
        setInitialLoading(false)
    }, [projectId, updateIssueData, setInitialLoading])

    // Listen for changes from other views (kanban, tasks)
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            // Skip if we're currently making changes from this page
            if (window.isIssuePageUpdating) {
                console.log('Issue page: Skipping scrumboardDataChanged event - we are updating');
                return;
            }
            
            try {
                // Get current scrumboard data (from localStorage if available, otherwise from mock data)
                let currentScrumboardData = scrumboardData
                
                try {
                    const storedData = localStorage.getItem('scrumboardData')
                    if (storedData) {
                        currentScrumboardData = JSON.parse(storedData)
                    }
                } catch (error) {
                    console.log('Using original mock data for Issue')
                }
                
                // Find the project in scrum board data by projectId or id
                for (const boardName in currentScrumboardData) {
                    const board = currentScrumboardData[boardName]
                    
                    const project = board.find(project => {
                        const matchesProjectId = project.projectId === projectId
                        const matchesId = project.id === projectId
                        return matchesProjectId || matchesId
                    })
                    
                    if (project) {
                        // Transform the project data to match the expected structure
                        const transformedProject = {
                            ...project,
                            // Map members to assignees for compatibility with IssueBody component
                            assignees: project.members || [],
                            // Ensure labels have the expected structure (id and title)
                            labels: (project.labels || []).map(label => ({
                                id: label,
                                title: label
                            })),
                            // Use board name as status
                            status: boardName,
                            // Convert dueDate to timestamp if it's a Date object
                            dueDate: project.dueDate ? (project.dueDate instanceof Date ? project.dueDate.getTime() / 1000 : project.dueDate) : null,
                            // Ensure arrays are properly initialized
                            comments: project.comments || [],
                            attachments: project.attachments || [],
                            activity: project.activity || [],
                            // Keep original members for backward compatibility
                            members: project.members || [],
                            // Ensure project name is available
                            name: project.name || project.title || 'Untitled Project'
                        }
                        
                        updateIssueData(transformedProject)
                        setLoading(false)
                        setNotFound(false)
                        return
                    }
                }
                
                // Project not found
                setNotFound(true)
                setLoading(false)
            } catch (error) {
                console.error('Error loading project data:', error)
                setNotFound(true)
                setLoading(false)
            }
        }

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
        
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged)
        }
    }, [projectId, updateIssueData])

    if (loading) {
        return (
            <AdaptiveCard>
                <Loading loading={true}>
                    <div className="h-full flex flex-col items-center justify-center">
                        <div>Loading project...</div>
                    </div>
                </Loading>
            </AdaptiveCard>
        )
    }

    if (notFound || isEmpty(issueData)) {
        return (
            <AdaptiveCard>
                <div className="h-full flex flex-col items-center justify-center">
                    <NotFound message={`Project ${projectId} not found!`} />
                </div>
            </AdaptiveCard>
        )
    }

    return (
        <div className="relative">
            {/* White Grid with Main Content (original full size) */}
            <AdaptiveCard className="relative z-10">
                <div className="relative">
                    <div className="xl:w-2/3">
                        <div className="px-6">
                            <IssueHeader />
                            <div className="mt-8">
                                <IssueBody />
                            </div>
                            <div className="mt-8">
                                <IssueFooter />
                            </div>
                        </div>
                    </div>
                    <div className="xl:absolute xl:top-0 xl:right-0 xl:w-1/3 xl:h-full">
                        <IssueActivity />
                    </div>
                </div>
            </AdaptiveCard>
        </div>
    )
}

export default Issue
