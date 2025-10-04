'use client'

import { useRef, useEffect, useState } from 'react'
import { useIssueStore } from '../_store/issueStore'
import useUserStore from '@/stores/userStore'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tabs from '@/components/ui/Tabs'
import NoMedia from '@/assets/svg/NoMedia'
import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import uniqueId from 'lodash/uniqueId'
import ReactHtmlParser from 'html-react-parser'
import { TbDownload, TbTrash, TbPlus, TbEdit, TbX, TbCheck } from 'react-icons/tb'
import { createActivityEntry, addActivityToProject, ACTIVITY_TYPES } from '@/utils/activityUtils'

const { TabNav, TabList, TabContent } = Tabs

// Counter for deterministic ID generation
let issueFooterUidCounter = 0

const createUID = (length) => {
    issueFooterUidCounter++
    return `footer${issueFooterUidCounter}`
}

const createCommentObject = (message, currentUser) => {
    return {
        id: createUID(10),
        name: currentUser?.name || 'Usuário',
        src: currentUser?.img || '',
        message: message,
        date: new Date(),
    }
}

const createAttachmentObject = (file) => {
    return {
        id: createUID(10),
        name: file.name,
        size: `${Math.round(file.size / 1000)} kb`,
        src: URL.createObjectURL(file),
        file: file,
    }
}

const IssueFooter = () => {
    const { issueData, updateIssueData } = useIssueStore()
    const { currentUser } = useUserStore()

    const commentInput = useRef(null)
    const fileInputRef = useRef(null)
    const [editingCommentId, setEditingCommentId] = useState(null)
    const [editingCommentText, setEditingCommentText] = useState('')
    const [localComments, setLocalComments] = useState([])
    const [localAttachments, setLocalAttachments] = useState([])

    // Early return if issueData is not available yet
    if (!issueData || Object.keys(issueData).length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <p>Loading project data...</p>
            </div>
        )
    }

    // Initialize local comments from issueData
    useEffect(() => {
        if (issueData?.comments) {
            setLocalComments(issueData.comments);
        }
    }, [issueData?.comments]);

    // Initialize local attachments from issueData
    useEffect(() => {
        if (issueData?.attachments) {
            setLocalAttachments(issueData.attachments);
        }
    }, [issueData?.attachments]);

    // Listen for changes from other views (kanban, tasks)
    useEffect(() => {
        const handleScrumboardDataChanged = () => {
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    const currentScrumboardData = JSON.parse(storedData);
                    
                    // Find the current project in the scrumboard data
                    for (const boardName in currentScrumboardData) {
                        const board = currentScrumboardData[boardName];
                        const project = board.find(p => p.id === issueData.id || p.projectId === issueData.projectId);
                        if (project) {
                            // Update issue data with comments, attachments, and activity from scrumboard
                            if (project.comments && JSON.stringify(project.comments) !== JSON.stringify(issueData.comments)) {
                                updateIssueData({ ...issueData, comments: project.comments });
                                setLocalComments(project.comments);
                            }
                            if (project.attachments && JSON.stringify(project.attachments) !== JSON.stringify(issueData.attachments)) {
                                updateIssueData({ ...issueData, attachments: project.attachments });
                                setLocalAttachments(project.attachments);
                            }
                            if (project.activity && JSON.stringify(project.activity) !== JSON.stringify(issueData.activity)) {
                                updateIssueData({ ...issueData, activity: project.activity });
                            }
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('Error syncing with scrumboard data:', error);
            }
        };

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChanged);
        };
    }, [updateIssueData]);

    const submitComment = () => {
        const message = commentInput.current?.value?.trim()
        if (message) {
            const comment = createCommentObject(message, currentUser)
            const updatedComments = [...localComments, comment]
            
            // Update local state immediately for UI feedback
            setLocalComments(updatedComments)
            
            const newIssueData = { ...issueData, comments: updatedComments }
            
            // Add activity entry for comment
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: message,
                projectId: newIssueData.projectId || newIssueData.id,
            }, currentUser)
            const updatedData = addActivityToProject(newIssueData, activityEntry)
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
            
            commentInput.current.value = ''
        }
    }

    const handleAddAttachment = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const newAttachments = Array.from(files).map(file => createAttachmentObject(file))
            const updatedAttachments = [...localAttachments, ...newAttachments]
            
            // Update local state immediately for UI feedback
            setLocalAttachments(updatedAttachments)
            
            const newIssueData = { ...issueData, attachments: updatedAttachments }
            
            // Add activity entry for adding files
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_FILES_TO_TICKET, {
                projectId: newIssueData.projectId || newIssueData.id,
                files: newAttachments,
            }, currentUser)
            const updatedData = addActivityToProject(newIssueData, activityEntry)
            
            // Update global state
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
            
            // Reset file input
            event.target.value = ''
        }
    }

    const handleRemoveAttachment = (attachmentId) => {
        const attachmentToRemove = localAttachments.find(attachment => attachment.id === attachmentId)
        const updatedAttachments = localAttachments.filter(attachment => attachment.id !== attachmentId)
        
        // Update local state immediately for UI feedback
        setLocalAttachments(updatedAttachments)
        
        const newIssueData = { ...issueData, attachments: updatedAttachments }
        
        // Add activity entry for removing attachment
        if (attachmentToRemove) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.ADD_FILES_TO_TICKET, {
                projectId: newIssueData.projectId || newIssueData.id,
                files: [attachmentToRemove],
                action: 'removed'
            }, currentUser)
            const updatedData = addActivityToProject(newIssueData, activityEntry)
            
            // Update global state
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        } else {
            // Update global state
            updateIssueData(newIssueData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(newIssueData)
        }
    }

    const handleDownloadAttachment = (attachment) => {
        if (attachment.file) {
            const url = URL.createObjectURL(attachment.file)
            const a = document.createElement('a')
            a.href = url
            a.download = attachment.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id)
        setEditingCommentText(comment.message)
    }

    const handleSaveEdit = () => {
        if (editingCommentText.trim()) {
            const updatedComments = localComments.map(comment => 
                comment.id === editingCommentId 
                    ? { ...comment, message: editingCommentText.trim() }
                    : comment
            )
            
            // Update local state immediately for UI feedback
            setLocalComments(updatedComments)
            
            const newIssueData = { ...issueData, comments: updatedComments }
            
            // Add activity entry for editing comment
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: editingCommentText.trim(),
                projectId: newIssueData.projectId || newIssueData.id,
                action: 'edited'
            }, currentUser)
            const updatedData = addActivityToProject(newIssueData, activityEntry)
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
            
            setEditingCommentId(null)
            setEditingCommentText('')
        }
    }

    const handleCancelEdit = () => {
        setEditingCommentId(null)
        setEditingCommentText('')
    }

    const handleRemoveComment = (commentId) => {
        const commentToRemove = localComments.find(comment => comment.id === commentId)
        const updatedComments = localComments.filter(comment => comment.id !== commentId)
        
        // Update local state immediately for UI feedback
        setLocalComments(updatedComments)
        
        const newIssueData = { ...issueData, comments: updatedComments }
        
        // Add activity entry for removing comment
        if (commentToRemove) {
            const activityEntry = createActivityEntry(ACTIVITY_TYPES.COMMENT, {
                comment: commentToRemove.message,
                projectId: newIssueData.projectId || newIssueData.id,
                action: 'removed'
            }, currentUser)
            const updatedData = addActivityToProject(newIssueData, activityEntry)
            updateIssueData(updatedData)
            
            // Save to all views (kanban and tasks)
            saveToAllViews(updatedData)
        } else {
            updateIssueData(newIssueData)
            saveToAllViews(newIssueData)
        }
    }

    const saveToAllViews = (newData) => {
        // Save to localStorage for persistence across all views
        try {
            const { scrumboardData } = require('@/mock/data/projectsData');
            let currentScrumboardData = scrumboardData;
            
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    currentScrumboardData = JSON.parse(storedData);
                }
            } catch (error) {
                console.log('Using original mock data');
            }

            // Find and update the project in the current data
            for (const boardName in currentScrumboardData) {
                const board = currentScrumboardData[boardName];
                const projectIndex = board.findIndex(p => p.id === newData.id || p.projectId === newData.projectId);
                if (projectIndex !== -1) {
                    // Update only the specific fields that changed
                    const existingProject = currentScrumboardData[boardName][projectIndex];
                    const updatedProject = {
                        ...existingProject,
                        ...(newData.comments && { comments: newData.comments }),
                        ...(newData.attachments && { attachments: newData.attachments }),
                        ...(newData.activity && { activity: newData.activity }),
                    };
                    
                    currentScrumboardData[boardName][projectIndex] = updatedProject;
                    
                    // Save to localStorage
                    try {
                        localStorage.setItem('scrumboardData', JSON.stringify(currentScrumboardData));
                        
                        // Dispatch custom event to notify other components
                        window.dispatchEvent(new Event('scrumboardDataChanged'));
                        
                        // Try to save to backend
                        try {
                            const ProjectDataService = require('@/services/ProjectDataService').default;
                            ProjectDataService.saveScrumboardData(currentScrumboardData);
                        } catch (error) {
                            console.log('Project updated (saved to localStorage)');
                        }
                    } catch (localStorageError) {
                        console.error('localStorage error:', localStorageError);
                        try {
                            window.dispatchEvent(new Event('scrumboardDataChanged'));
                        } catch (eventError) {
                            console.error('Failed to dispatch event:', eventError);
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving to all views:', error);
        }
    }

    return (
        <Tabs className="mt-6" defaultValue="comments">
            <TabList>
                <TabNav value="comments">Comentários</TabNav>
                <TabNav value="attachments">Anexos</TabNav>
            </TabList>
            <div className="p-4">
                <TabContent value="comments">
                    <div className="w-full">
                        {localComments &&
                            localComments?.length > 0 && (
                                <>
                                    {localComments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="mb-3 flex"
                                        >
                                            <div className="mt-2">
                                                <Avatar
                                                    shape="circle"
                                                    src={comment.src}
                                                />
                                            </div>
                                            <div className="ml-2 rtl:mr-2 p-3 rounded-sm w-100">
                                                <div className="flex items-center mb-2">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {comment.name}
                                                    </span>
                                                    <span className="mx-1">
                                                        {' '}
                                                        |{' '}
                                                    </span>
                                                    <span>
                                                        {dayjs(
                                                            comment.date,
                                                        ).format(
                                                            'DD MMMM YYYY',
                                                        )}
                                                    </span>
                                                    {/* Show edit/remove buttons only for current user's comments */}
                                                    {comment.name === currentUser?.name && (
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Tooltip title="Editar comentário">
                                                                <Button
                                                                    variant="plain"
                                                                    size="xs"
                                                                    icon={<TbEdit />}
                                                                    onClick={() => handleEditComment(comment)}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Remover comentário">
                                                                <Button
                                                                    variant="plain"
                                                                    size="xs"
                                                                    icon={<TbTrash />}
                                                                    onClick={() => handleRemoveComment(comment.id)}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    {editingCommentId === comment.id ? (
                                                        <div className="space-y-2">
                                                            <Input
                                                                value={editingCommentText}
                                                                onChange={(e) => setEditingCommentText(e.target.value)}
                                                                textArea
                                                                placeholder="Editar comentário"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="xs"
                                                                    icon={<TbCheck />}
                                                                    onClick={handleSaveEdit}
                                                                    variant="solid"
                                                                >
                                                                    Salvar
                                                                </Button>
                                                                <Button
                                                                    size="xs"
                                                                    icon={<TbX />}
                                                                    onClick={handleCancelEdit}
                                                                    variant="plain"
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        ReactHtmlParser(
                                                            comment.message || '',
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        <div className="mb-3 flex gap-2">
                            <Avatar
                                shape="circle"
                                src={currentUser?.img || ''}
                            />
                            <div className="w-full relative">
                                <Input
                                    ref={commentInput}
                                    textArea
                                    placeholder="Comente algo"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <div
                                        className="cursor-pointer font-semibold text-primary"
                                        onClick={() => submitComment()}
                                    >
                                        Enviar
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabContent>
                <TabContent value="attachments">
                    {(localAttachments && localAttachments.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            {localAttachments.map((file) => (
                                <Card
                                    key={file.id}
                                    bodyClass="px-3 pt-3 pb-1"
                                    className="bg-gray-100 dark:bg-gray-700 shadow-none"
                                    bordered={false}
                                >
                                    {file.name.toLowerCase().endsWith('.pdf') ? (
                                        <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-4xl text-red-500 mb-2">📄</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">PDF</div>
                                            </div>
                                        </div>
                                    ) : file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                            className="max-w-full rounded-lg"
                                            alt={file.name}
                                            src={file.src}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-32 bg-gray-200 dark:bg-gray-600 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-4xl text-gray-500 mb-2">📎</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">Arquivo</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-1 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                {file.name}
                                            </div>
                                            <span className="text-xs">
                                                {file.size}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Tooltip title="Download">
                                                <Button
                                                    variant="plain"
                                                    size="xs"
                                                    icon={<TbDownload />}
                                                    onClick={() => handleDownloadAttachment(file)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <Button
                                                    variant="plain"
                                                    size="xs"
                                                    icon={<TbTrash />}
                                                    onClick={() => handleRemoveAttachment(file.id)}
                                                />
                                            </Tooltip>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 items-center justify-center">
                            <NoMedia height={150} width={150} />
                            <p className="font-semibold">Sem anexos</p>
                        </div>
                    )}
                    <div className="mt-4 flex justify-center">
                        <Button
                            icon={<TbPlus />}
                            onClick={handleAddAttachment}
                            variant="solid"
                            size="sm"
                        >
                            Adicionar Anexo
                        </Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </TabContent>
            </div>
        </Tabs>
    )
}

export default IssueFooter
