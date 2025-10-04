'use client'
import { useState, lazy, Suspense, useEffect } from 'react'
import Spinner from '@/components/ui/Spinner'
import ProjectDetailsHeader from './ProjectDetailsHeader'
import ProjectDetailsNavigation from './ProjectDetailsNavigation'
import ProjectDetailsProvider from './ProjectDetailsProvider'
import useResponsive from '@/utils/hooks/useResponsive'
import { apiGetProject } from '@/services/ProjectService'
import useSWR from 'swr'

const defaultNavValue = 'overview'
const settingsNavValue = 'settings'

const ProjectDetailsOverview = lazy(() => import('./ProjectDetailsOverview'))
const ProjectDetailsTask = lazy(() => import('./ProjectDetailsTask'))
const ProjectDetailsAttachments = lazy(
    () => import('./ProjectDetailsAttachments'),
)
const ProjectDetailsActivity = lazy(() => import('./ProjectDetailsActivity'))
const ProjectDetailsSetting = lazy(() => import('./ProjectDetailsSetting'))

const ProjectDetails = ({ id }) => {
    const { data, mutate } = useSWR(
        [`/api/projects/${id}`],
        () => apiGetProject({ id }),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const { larger } = useResponsive()

    const [selectedNav, setSelectedNav] = useState(defaultNavValue)
    const [isContentEdit, setIsContentEdit] = useState(false)

    const handleEdit = (isEdit) => {
        setSelectedNav(settingsNavValue)
        setIsContentEdit(isEdit)
    }

    const handleContentChange = (content) => {
        mutate({ ...data, content }, false)
        setIsContentEdit(false)
    }

    const handleUpdate = async ({ name, content, dueDate }) => {
        const newData = { ...data }
        newData.name = name
        newData.content = content
        if (newData.schedule) {
            newData.schedule.dueDate = dueDate
        }

        mutate({ ...newData }, false)
        
        // Also update the scrum board data if this project exists there
        try {
            const storedData = localStorage.getItem('scrumboardData');
            if (storedData) {
                const scrumboardData = JSON.parse(storedData);
                let updated = false;
                
                // Find and update the project in scrum board data
                for (const boardName in scrumboardData) {
                    const board = scrumboardData[boardName];
                    const projectIndex = board.findIndex(p => p.id === id || p.projectId === id);
                    if (projectIndex !== -1) {
                        scrumboardData[boardName][projectIndex] = {
                            ...scrumboardData[boardName][projectIndex],
                            name: name,
                            description: content
                        };
                        updated = true;
                        break;
                    }
                }
                
                if (updated) {
                    localStorage.setItem('scrumboardData', JSON.stringify(scrumboardData));
                    window.dispatchEvent(new Event('scrumboardDataChanged'));
                    
                    // Save to backend
                    try {
                        const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                        await ProjectDataService.saveScrumboardData(scrumboardData);
                    } catch (error) {
                        console.error('Error saving to backend:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating scrum board data:', error);
        }
        
        setIsContentEdit(false)
        setSelectedNav(defaultNavValue)
    }

    const handleNavigationChange = (val) => {
        if (val === settingsNavValue) {
            setIsContentEdit(true)
        } else {
            setIsContentEdit(false)
        }
        setSelectedNav(val)
    }

    // Listen for scrumboardDataChanged events to sync with localStorage
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            // This will trigger a re-render if the project data changes
            // The individual components (like ProjectDetailsTask) will handle their own updates
        };

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        };
    }, []);

    return (
        <ProjectDetailsProvider projectId={id}>
            <div>
                {data && (
                    <>
                        <ProjectDetailsHeader
                            title={data.name}
                            isContentEdit={isContentEdit}
                            selected={selectedNav}
                            onEdit={handleEdit}
                            onChange={handleNavigationChange}
                        />
                        <div className="mt-6 flex gap-12">
                            {larger.xl && (
                                <ProjectDetailsNavigation
                                    selected={selectedNav}
                                    onChange={handleNavigationChange}
                                />
                            )}
                            <div className="w-full">
                                <Suspense
                                    fallback={
                                        <div className="my-4 mx-auto text-center flex justify-center">
                                            <Spinner size={40} />
                                        </div>
                                    }
                                >
                                    {selectedNav === defaultNavValue && (
                                        <ProjectDetailsOverview
                                            content={data.content}
                                            client={data.client}
                                            schedule={data.schedule}
                                            isContentEdit={isContentEdit}
                                            setIsContentEdit={setIsContentEdit}
                                            onContentChange={handleContentChange}
                                        />
                                    )}
                                    {selectedNav === 'tasks' && (
                                        <ProjectDetailsTask />
                                    )}
                                    {selectedNav === 'attachments' && (
                                        <ProjectDetailsAttachments />
                                    )}
                                    {selectedNav === 'activity' && (
                                        <ProjectDetailsActivity />
                                    )}
                                    {selectedNav === 'settings' && (
                                        <ProjectDetailsSetting
                                            name={data.name}
                                            content={data.content}
                                            dueDate={data.schedule.dueDate}
                                            onUpdate={handleUpdate}
                                        />
                                    )}
                                </Suspense>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ProjectDetailsProvider>
    )
}

export default ProjectDetails
