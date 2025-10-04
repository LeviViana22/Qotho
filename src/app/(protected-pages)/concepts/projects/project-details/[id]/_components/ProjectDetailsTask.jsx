import { useState, useEffect } from 'react'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Loading from '@/components/shared/Loading'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Avatar from '@/components/ui/Avatar'
import { apiGetScrumBoards } from '@/services/ProjectService'
import { TbCircleCheck, TbCircleCheckFilled, TbPlus } from 'react-icons/tb'
import useSWR from 'swr'
import dayjs from 'dayjs'
import { useProjectStore } from '../../_store/projectStore'
import { useUserStore } from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'

// Removed hardcoded ordered array - boards are now dynamic

const taskLabelColors = {
    'Live issue': 'bg-rose-100 dark:bg-rose-100 dark:text-gray-900',
    Task: 'bg-blue-100 dark:bg-blue-100 dark:text-gray-900',
    Bug: 'bg-amber-100 dark:bg-amber-100 dark:text-gray-900',
    'Low priority': 'bg-purple-100 dark:bg-purple-100 dark:text-gray-900',
}

const { Td, Tr, TBody } = Table

const ProjectDetailsTask = () => {
    const [selectedTask, setSelectedTask] = useState(null)
    const [selectedMembers, setSelectedMembers] = useState([])

    // Use Zustand store instead of SWR for better synchronization
    const { scrumBoardData, updateScrumBoardData } = useProjectStore()
    
    // Get real users from the user store
    const { users } = useUserStore()
    const isHydrated = useUserStoreHydrated()
    
    // Use scrumBoardData from store as the primary data source
    const data = scrumBoardData
    const isLoading = false // We'll handle loading state differently

    // Listen for scrumboardDataChanged events to sync with localStorage
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    const newData = JSON.parse(storedData);
                    updateScrumBoardData(newData); // Update Zustand store
                }
            } catch (error) {
                console.error('Error updating project details from localStorage event:', error);
            }
        };

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        };
    }, [updateScrumBoardData]);

    const handleCheckClick = (key, id) => {
        if (key !== 'Completed') {
            setSelectedTask({ key, id })
            
            // Load current members for this task
            if (data && data[key]) {
                const task = data[key].find(t => t.id === id)
                if (task && task.members) {
                    setSelectedMembers(task.members)
                } else {
                    setSelectedMembers([])
                }
            }
        }
    }

    const handleDialogConfirmClick = async () => {
        if (selectedTask) {
            const { key, id } = selectedTask
            const newData = { ...data }
            if (key !== 'Completed') {
                let taskToMove = {}
                newData[key] = newData[key].filter((task) => {
                    if (task.id === id) {
                        task.checked = true
                        taskToMove = task
                    }
                    return task.id !== id
                })
                newData['Completed'].push(taskToMove)
                
                // Update Zustand store
                updateScrumBoardData(newData)
                
                // Save to localStorage and dispatch event
                try {
                    localStorage.setItem('scrumboardData', JSON.stringify(newData));
                    window.dispatchEvent(new Event('scrumboardDataChanged'));
                    
                    // Save to backend
                    try {
                        const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                        await ProjectDataService.saveScrumboardData(newData);
                    } catch (error) {
                        console.error('Error saving to backend:', error);
                    }
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                }
                
                setSelectedTask(null)
            }
        }
    }

    const handleDialogClose = () => {
        setSelectedTask(null)
    }

    // Member management functions (same as kanban dialog)
    const handleAddMember = (member) => {
        if (!selectedMembers.find(m => m.id === member.id)) {
            const newSelectedMembers = [...selectedMembers, member]
            setSelectedMembers(newSelectedMembers)
            
            // Update the project in scrum board data
            updateProjectMembers(newSelectedMembers)
        }
    }

    const handleRemoveMember = (memberId) => {
        const newSelectedMembers = selectedMembers.filter(m => m.id !== memberId)
        setSelectedMembers(newSelectedMembers)
        
        // Update the project in scrum board data
        updateProjectMembers(newSelectedMembers)
    }

    const updateProjectMembers = async (newMembers) => {
        try {
            const storedData = localStorage.getItem('scrumboardData');
            if (storedData) {
                const currentScrumboardData = JSON.parse(storedData);
                let updated = false;
                
                // Find and update the project in all boards
                for (const boardName in currentScrumboardData) {
                    const board = currentScrumboardData[boardName];
                    const projectIndex = board.findIndex(p => p.id === selectedTask?.id || p.projectId === selectedTask?.id);
                    if (projectIndex !== -1) {
                        currentScrumboardData[boardName][projectIndex] = {
                            ...currentScrumboardData[boardName][projectIndex],
                            members: newMembers
                        };
                        updated = true;
                        break;
                    }
                }
                
                if (updated) {
                    // Update Zustand store
                    updateScrumBoardData(currentScrumboardData);
                    
                    // Save to localStorage
                    localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                    
                    // Dispatch event
                    window.dispatchEvent(new Event('scrumboardDataChanged'));
                    
                    // Save to backend
                    try {
                        const ProjectDataService = (await import('@/services/ProjectDataService')).default;
                        await ProjectDataService.saveScrumboardData(currentScrumboardData);
                    } catch (error) {
                        console.error('Error saving to backend:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating project members:', error);
        }
    }

    return (
        <>
            <Loading loading={isLoading}>
                <div className="flex flex-col gap-12">
                    {/* Atendente Field */}
                    <div className="flex items-center min-h-[30px] mb-6">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Atendente:
                        </div>
                        <div className="flex items-center gap-1">
                            <UsersAvatarGroup avatarProps={{ size: 25 }} users={selectedMembers} />
                            <Dropdown
                                renderTitle={
                                    <Button
                                        icon={<TbPlus />}
                                        customColorClass={() =>
                                            'border-2 border-dashed hover:ring-0 h-[30px] w-[30px] text-sm'
                                        }
                                        size="sm"
                                        shape="circle"
                                    />
                                }
                                placement="bottom"
                            >
                                {isHydrated && users && users.length > 0 ? users.map((member) => {
                                    const isSelected = selectedMembers.find(m => m.id === member.id)
                                    return (
                                        <Dropdown.Item
                                            key={member.id}
                                            eventKey={member.id}
                                            onSelect={() => {
                                                if (isSelected) {
                                                    handleRemoveMember(member.id)
                                                } else {
                                                    handleAddMember(member)
                                                }
                                            }}
                                        >
                                            <div className="flex items-center">
                                                <Avatar
                                                    shape="circle"
                                                    size={22}
                                                    src={member.img}
                                                />
                                                <span className="ml-2 rtl:mr-2">
                                                    {member.name}
                                                </span>
                                                {isSelected && (
                                                    <span className="ml-auto text-green-500">✓</span>
                                                )}
                                            </div>
                                        </Dropdown.Item>
                                    )
                                }) : (
                                    <Dropdown.Item disabled>
                                        <span className="text-gray-500">Carregando usuários...</span>
                                    </Dropdown.Item>
                                )}
                            </Dropdown>
                        </div>
                    </div>
                    
                    {data && Object.keys(data).map((key, index) => (
                        <div key={key + index}>
                            <h4 className="mb-4">{key}</h4>
                            {data && (
                                <Table compact hoverable={false}>
                                    <TBody>
                                        {data[key].map((task) => (
                                            <Tr key={task.id}>
                                                <Td className="w-[40px]">
                                                    <button
                                                        className="text-2xl cursor-pointer pt-1"
                                                        role="button"
                                                        onClick={() =>
                                                            handleCheckClick(
                                                                key,
                                                                task.id,
                                                            )
                                                        }
                                                    >
                                                        {task.checked ? (
                                                            <TbCircleCheckFilled className="text-primary" />
                                                        ) : (
                                                            <TbCircleCheck className="hover:text-primary" />
                                                        )}
                                                    </button>
                                                </Td>
                                                <Td className="w-[500px]">
                                                    <span className="heading-text font-bold">
                                                        {task.name}
                                                    </span>
                                                </Td>
                                                <Td className="w-[200px]">
                                                    {task.labels?.map(
                                                        (label, index) => (
                                                            <Tag
                                                                key={
                                                                    label +
                                                                    index
                                                                }
                                                                className={`mr-2 rtl:ml-2 mb-2 ${taskLabelColors[label]}`}
                                                            >
                                                                {label}
                                                            </Tag>
                                                        ),
                                                    )}
                                                </Td>
                                                <Td className="w-[150px]">
                                                    <span className="font-semibold">
                                                        {task.dueDate
                                                            ? dayjs(
                                                                  task.dueDate,
                                                              ).format(
                                                                  'MMMM DD',
                                                              )
                                                            : '-'}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <UsersAvatarGroup
                                                        avatarProps={{
                                                            size: 25,
                                                        }}
                                                        users={task.members}
                                                    />
                                                </Td>
                                            </Tr>
                                        ))}
                                    </TBody>
                                </Table>
                            )}
                        </div>
                    ))}
                </div>
            </Loading>
            <ConfirmDialog
                isOpen={Boolean(selectedTask)}
                type="info"
                title="Mark task as completed"
                onClose={handleDialogClose}
                onRequestClose={handleDialogClose}
                onCancel={handleDialogClose}
                onConfirm={handleDialogConfirmClick}
            >
                <p>Are you sure you want mark this task as completed? </p>
            </ConfirmDialog>
        </>
    )
}

export default ProjectDetailsTask
