'use client'
import { useState } from 'react'
import { Form } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
import {
    TbPencil,
    TbCirclePlus,
    TbTrash,
    TbCircleXFilled,
    TbPalette,
} from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { createDynamicColorMappingsFromDB } from '../utils/boardColors'
import { useBoardColors } from '../_contexts/BoardColorsContext'
import BoardColorPicker from './BoardColorPicker'
import { useMemo } from 'react'

const RenameForm = ({
    title,
    closeRenameForm,
    columns = {},
    ordered,
    onEnter,
}) => {
    const onFormSubmit = (value) => {
        const newTitle = value.title

        if (ordered.some((elm) => elm === newTitle)) {
            closeRenameForm()
            return
        }

        const newColumns = { ...columns }
        newColumns[newTitle] = columns[title]
        delete newColumns[title]

        const newOrder = ordered.map((elm) => {
            if (elm === title) {
                return newTitle
            }
            return elm
        })
        onEnter(newColumns, newOrder, newTitle)
        closeRenameForm()
    }

    const { control, handleSubmit } = useForm({
        defaultValues: {
            title,
        },
    })

    return (
        <>
            <Form onSubmit={handleSubmit(onFormSubmit)}>
                <Controller
                    name="title"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <Input type="text" autoComplete="off" {...field} />
                    )}
                />
            </Form>
        </>
    )
}

const BoardTitle = (props) => {
    const { dragHandleProps, title, contents } = props

    const {
        columns,
        ordered,
        openDialog,
        updateColumns,
        updateDialogView,
        setSelectedBoard,
        updateOrdered,
    } = useRegistroCivilStore()

    const [renameActive, setRenameActive] = useState(false)
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false)
    const [colorPickerOpen, setColorPickerOpen] = useState(false)

    // Get board colors from database
    const { boardColors, saveColor, getBoardColor } = useBoardColors()

    // Get dynamic color for the board title using database colors (memoized)
    const titleColorClass = useMemo(() => {
        return createDynamicColorMappingsFromDB(columns, boardColors, 'titleHighlight')[title] || 'bg-gray-200 dark:bg-gray-700'
    }, [columns, boardColors, title])

    const onRenameActive = () => {
        setRenameActive(true)
    }

    const onRenameDeactivate = () => {
        setRenameActive(false)
    }

    const onConfirmDeleteClose = () => {
        setConfirmDeleteDialog(false)
    }

    const onBoardDelete = () => {
        setConfirmDeleteDialog(true)
    }

    const onAddNewTicket = () => {
        openDialog()
        updateDialogView('NEW_TICKET')
        setSelectedBoard(title)
    }

    const onColorPickerOpen = () => {
        setColorPickerOpen(true)
    }

    const onColorPickerClose = () => {
        setColorPickerOpen(false)
    }

    const onColorSelect = async (color) => {
        try {
            await saveColor(title, color)
        } catch (error) {
            console.error('Error saving board color:', error)
        }
    }

    const onDelete = async () => {
        const newOrder = ordered.filter((elm) => elm !== title)
        const newColumns = {}
        Object.assign(newColumns, columns)
        delete newColumns[title]
        updateOrdered(newOrder)
        updateColumns(newColumns)
        
        // Delete all projects in this board from the database
        try {
            const projectsToDelete = columns[title] || []
            
            for (const project of projectsToDelete) {
                if (project.id) {
                    const response = await fetch(`/api/projects/${project.id}`, {
                        method: 'DELETE',
                    })
                    
                    if (!response.ok) {
                        console.error(`Failed to delete project ${project.id}:`, await response.text())
                    }
                }
            }
            
            // Also delete any placeholder projects for this board
            const allProjectsResponse = await fetch('/api/projects/registro-civil')
            if (allProjectsResponse.ok) {
                const allBoards = await allProjectsResponse.json()
                const boardProjects = allBoards[title] || []
                
                for (const project of boardProjects) {
                    if (project.name && project.name.startsWith('Board: ')) {
                        // This is a placeholder project, delete it
                        const response = await fetch(`/api/projects/${project.id}`, {
                            method: 'DELETE',
                        })
                        
                        if (!response.ok) {
                            console.error(`Failed to delete placeholder project ${project.id}:`, await response.text())
                        }
                    }
                }
            }
            
            console.log(`Board "${title}" and all its projects deleted from database`)
        } catch (error) {
            console.error('Error deleting board from database:', error)
        }
    }

    const handleEnter = async (newColumns, newOrder, newTitle) => {
        const oldBoardName = title
        const newBoardName = newTitle
        
        // Prevent renaming of special finalized boards
        if (oldBoardName === 'Concluídas' || oldBoardName === 'Canceladas') {
            console.error('Cannot rename finalized boards')
            return
        }
        
        // Prevent using reserved board names
        if (newBoardName === 'Concluídas' || newBoardName === 'Canceladas') {
            console.error('Cannot use reserved board names')
            return
        }
        
        if (newBoardName && columns[oldBoardName]) {
            try {
                // Use the dedicated rename board API endpoint
                const response = await fetch('/api/projects/registro-civil/rename-board', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        oldBoardName,
                        newBoardName
                    }),
                })
                
                if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Failed to rename board:', errorData.error)
                    // Don't update UI state if database update fails
                    return
                }
                
                const result = await response.json()
                console.log('Board renamed successfully:', result.message)
                
                // Only update UI state after successful database update
                updateColumns(newColumns)
                updateOrdered(newOrder)
            } catch (error) {
                console.error('Error saving board rename to database:', error)
                // Don't update UI state if database update fails
            }
        }
    }

    return (
        <div
            className="board-title px-5 py-4 flex justify-between items-center"
            {...dragHandleProps}
        >
            {renameActive ? (
                <>
                    <RenameForm
                        title={title}
                        closeRenameForm={onRenameDeactivate}
                        columns={columns}
                        ordered={ordered}
                        onEnter={handleEnter}
                    />
                    <TbCircleXFilled
                        className="cursor-pointer text-lg"
                        onClick={onRenameDeactivate}
                    />
                </>
            ) : (
                <>
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 w-full max-w-[252px] ${titleColorClass}`}>
                        <h6 className="truncate flex-1 min-w-0 text-sm">
                            {title}
                        </h6>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            ({contents?.length || 0})
                        </span>
                        <Dropdown
                            placement="bottom-end"
                            renderTitle={<EllipsisButton />}
                        >
                            {/* Only show rename option for non-finalized boards */}
                            {title !== 'Concluídas' && title !== 'Canceladas' && (
                                <Dropdown.Item
                                    eventKey="renameBoard"
                                    onClick={onRenameActive}
                                >
                                    <span className="text-lg">
                                        <TbPencil />
                                    </span>
                                    <span>Renomear</span>
                                </Dropdown.Item>
                            )}
                            <Dropdown.Item
                                eventKey="addTicket"
                                onClick={onAddNewTicket}
                            >
                                <span className="text-lg">
                                    <TbCirclePlus />
                                </span>
                                <span>Adicionar Projeto</span>
                            </Dropdown.Item>
                            <Dropdown.Item
                                eventKey="changeColor"
                                onClick={onColorPickerOpen}
                            >
                                <span className="text-lg">
                                    <TbPalette />
                                </span>
                                <span>Cor</span>
                            </Dropdown.Item>
                            <Dropdown.Item
                                eventKey="deleteBoard"
                                onClick={onBoardDelete}
                            >
                                <span className="text-lg">
                                    <TbTrash />
                                </span>
                                <span>Deletar Quadro</span>
                            </Dropdown.Item>
                        </Dropdown>
                    </div>
                </>
            )}
            <ConfirmDialog
                isOpen={confirmDeleteDialog}
                type="danger"
                title="Deletar Quadro"
                onClose={onConfirmDeleteClose}
                onRequestClose={onConfirmDeleteClose}
                onCancel={onConfirmDeleteClose}
                onConfirm={onDelete}
            >
                <p>
                    Tem certeza que deseja deletar este quadro? Todos os projetos
                    neste quadro serão deletados também. Esta ação não pode
                    ser desfeita.
                </p>
            </ConfirmDialog>
            
            <BoardColorPicker
                isOpen={colorPickerOpen}
                onClose={onColorPickerClose}
                currentColor={getBoardColor(title)}
                onColorSelect={onColorSelect}
            />
        </div>
    )
}

export default BoardTitle

