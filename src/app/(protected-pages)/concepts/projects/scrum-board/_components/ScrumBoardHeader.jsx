'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Input from '@/components/ui/Input'
import Drawer from '@/components/ui/Drawer'
import Dialog from '@/components/ui/Dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Switcher from '@/components/ui/Switcher'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useFieldConfigStore } from '../_store/fieldConfigStore'
import { useScrumBoardUsers } from '../_hooks/useScrumBoardUsers'
import { useScrumBoardAccess } from '../_hooks/useScrumBoardAccess'
import useUserStore from '@/stores/userStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useMemo, useEffect } from 'react'
import Table from '@/components/ui/Table'
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { MdDragIndicator } from 'react-icons/md'
import { TbUserPlus, TbSettings, TbPlus, TbChevronDown, TbSearch, TbX, TbPalette, TbTrash } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

const { Tr, Th, Td, THead, TBody } = Table

// Color picker component
const ColorPicker = ({ value, onChange }) => {
    const lightColors = [
        'lightyellow', 'yellow', 'orange', 'lightcoral', // Yellow/Orange tones
        'lightpink', 'pink', 'lightblue', 'blue', // Pink/Blue tones
        'lightgreen', 'green', 'lightgray', 'gray' // Green/Gray tones
    ]

    return (
        <Dropdown
            placement="bottom-start"
            renderTitle={
                <Button
                    size="xs"
                    variant="plain"
                    icon={<TbPalette />}
                    className="p-1"
                />
            }
        >
            <div 
                className="p-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.preventDefault()}
            >
                <div className="grid grid-cols-6 gap-1">
                    {lightColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded border-2 ${
                                value === color ? 'border-gray-800' : 'border-gray-300'
                            } hover:border-gray-600`}
                            style={{ backgroundColor: color }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onChange(color)
                            }}
                        />
                    ))}
                </div>
            </div>
        </Dropdown>
    )
}

const ScrumBoardHeader = () => {
    const router = useRouter()
    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false)
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false)
    const [editingField, setEditingField] = useState(null)
    const [fieldToDelete, setFieldToDelete] = useState(null)
    const [editFormData, setEditFormData] = useState({
        name: '',
        type: '',
        mandatory: false,
        searchable: false,
        ativo: true,
        visibleInBoard: false,
        options: []
    })
    const [newOption, setNewOption] = useState('')
    const { fieldConfig, updateField, reorderFields, addField, removeField, loadFieldConfigs, isLoading: fieldsLoading, isInitialized: fieldsInitialized } = useFieldConfigStore()
    const { currentUser } = useUserStore()
    // Get scrum board access control
    const { members: accessMembers, isAdmin } = useScrumBoardAccess()
    
    // Get all users for the add member dialog
    const { users: allUsers, hasUsers, isLoading } = useScrumBoardUsers()
    
    // For now, always use real users from the API (bypass access control for display)
    // TODO: Re-enable access control once the API is working properly
    const displayUsers = allUsers || []
    
    // Load field configurations from database on mount
    useEffect(() => {
        if (!fieldsInitialized && !fieldsLoading) {
            console.log('ScrumBoardHeader: Loading field configurations from database')
            loadFieldConfigs()
        }
    }, [fieldsInitialized, fieldsLoading, loadFieldConfigs])


    const fieldTypeOptions = [
        { value: 'text', label: 'Texto' },
        { value: 'date', label: 'Data' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'radio', label: 'Radio' },
        { value: 'number', label: 'Número' },
        { value: 'email', label: 'Email' },
        { value: 'multiselect', label: 'Seleção Múltipla' },
        { value: 'switch', label: 'Switch' },
        { value: 'time', label: 'Hora' },
        { value: 'datetime', label: 'Data e Hora' }
    ]

    const { updateDialogView, openDialog, currentView, setCurrentView, searchQuery, setSearchQuery } = useScrumBoardStore()

    // Check admin permission and show toast if not authorized
    const checkAdminPermission = () => {
        if (!isAdmin) {
            toast.push(
                <Notification type="danger">Sem permissão!</Notification>,
                {
                    placement: 'top-center',
                }
            )
            return false
        }
        return true
    }

    const onAddMember = () => {
        if (!checkAdminPermission()) return
        
        updateDialogView('ADD_MEMBER')
        openDialog()
    }

    const handleAddNewColumn = () => {
        updateDialogView('NEW_COLUMN')
        openDialog()
    }

    const handleAddNewTask = () => {
        updateDialogView('NEW_TICKET')
        openDialog()
    }

    const handleViewChange = (view) => {
        setCurrentView(view)
    }

    const getViewLabel = () => {
        return currentView === 'em-andamento' ? 'Em Andamento' : 'Finalizados'
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    const openSettingsDrawer = () => {
        setIsSettingsDrawerOpen(true)
    }

    const closeSettingsDrawer = () => {
        setIsSettingsDrawerOpen(false)
    }

    const openEditDialog = (field) => {
        // Don't allow editing fixed fields
        const FIXED_FIELD_NAMES = ['name', 'atendente', 'pendencias']
        if (FIXED_FIELD_NAMES.includes(field.fieldName)) {
            console.warn('Cannot edit fixed fields')
            return
        }
        
        setEditingField(field)
        setEditFormData({
            name: field.nome,
            type: field.tipo.toLowerCase(),
            mandatory: field.obrigatorio,
            searchable: field.pesquisavel,
            ativo: field.ativo !== false,
            visibleInBoard: field.visivelNoQuadro || false,
            options: (field.options || []).map(option => ({
                ...option,
                color: option.color || 'lightblue' // Add default color if missing
            }))
        })
        setNewOption('')
        setIsEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setIsEditDialogOpen(false)
        setEditingField(null)
        setEditFormData({
            name: '',
            type: '',
            mandatory: false,
            searchable: false,
            ativo: true,
            visibleInBoard: false,
            options: []
        })
        setNewOption('')
    }

    const closeAddFieldDialog = () => {
        setIsAddFieldDialogOpen(false)
        setEditFormData({
            name: '',
            type: '',
            mandatory: false,
            searchable: false,
            ativo: true,
            visibleInBoard: false,
            options: []
        })
        setNewOption('')
    }

    const handleEditFormChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const addOption = () => {
        if (newOption.trim()) {
            setEditFormData(prev => ({
                ...prev,
                options: [...prev.options, { 
                    value: newOption.trim().toUpperCase(), 
                    label: newOption.trim().toUpperCase(),
                    color: 'lightblue' // Default light blue color
                }]
            }))
            setNewOption('')
        }
    }

    const removeOption = (index) => {
        setEditFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }))
    }

    const needsOptions = (type) => {
        return ['dropdown', 'radio', 'multiselect'].includes(type.toLowerCase())
    }

    const handleSaveEdit = () => {
        if (editingField) {
            console.log('ScrumBoardHeader - Updating field:', editingField.id, {
                nome: editFormData.name,
                tipo: editFormData.type,
                obrigatorio: editFormData.mandatory,
                pesquisavel: editFormData.searchable,
                options: editFormData.options
            })
            
            updateField(editingField.id, {
                nome: editFormData.name,
                tipo: editFormData.type, // Keep the original case from fieldTypeOptions
                obrigatorio: editFormData.mandatory,
                pesquisavel: editFormData.searchable,
                ativo: editFormData.ativo,
                visivelNoQuadro: editFormData.visibleInBoard,
                fieldName: editingField.fieldName, // Keep the original fieldName
                options: editFormData.options,
                order: editingField.order // Keep the original order
            })
            
            // Debug: Check if the field was updated
            setTimeout(() => {
                const { fieldConfig } = useFieldConfigStore.getState()
                const updatedField = fieldConfig.find(field => field.id === editingField.id)
                console.log('ScrumBoardHeader - Field updated to:', updatedField)
            }, 100)
        }
        closeEditDialog()
    }

    const handleCreateField = () => {
        if (editFormData.name.trim()) {
            console.log('ScrumBoardHeader - Creating new field:', {
                name: editFormData.name,
                type: editFormData.type,
                mandatory: editFormData.mandatory,
                searchable: editFormData.searchable,
                ativo: editFormData.ativo,
                options: editFormData.options
            })
            
            addField({
                name: editFormData.name,
                type: editFormData.type,
                mandatory: editFormData.mandatory,
                searchable: editFormData.searchable,
                ativo: editFormData.ativo,
                visibleInBoard: editFormData.visibleInBoard,
                options: editFormData.options
            })
            
            closeAddFieldDialog()
        }
    }

    const handleDeleteField = (field) => {
        setFieldToDelete(field)
        setIsDeleteConfirmDialogOpen(true)
    }

    const onConfirmDeleteClose = () => {
        setIsDeleteConfirmDialogOpen(false)
        setFieldToDelete(null)
    }

    const onConfirmDelete = () => {
        if (fieldToDelete) {
            removeField(fieldToDelete.id)
            onConfirmDeleteClose()
        }
    }

    // Table configuration
    const reorderData = (startIndex, endIndex) => {
        reorderFields(startIndex, endIndex)
    }

    const handleDragEnd = (result) => {
        const { source, destination } = result
        if (!destination) return
        reorderData(source.index, destination.index)
    }

    const columns = useMemo(
        () => [
            {
                id: 'dragger',
                header: '',
                accessorKey: 'dragger',
                cell: (props) => (
                    <span {...props.dragHandleProps}>
                        <MdDragIndicator />
                    </span>
                ),
            },
            { 
                header: 'Nome', 
                accessorKey: 'nome',
                cell: (props) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {props.getValue()}
                    </span>
                )
            },
            { 
                header: 'Tipo', 
                accessorKey: 'tipo',
                cell: (props) => {
                    const tipo = props.getValue()
                    const tipoMap = {
                        'text': 'Texto',
                        'texto': 'Texto',
                        'date': 'Data',
                        'data': 'Data',
                        'dropdown': 'Dropdown',
                        'select': 'Dropdown',
                        'checkbox': 'Checkbox',
                        'radio': 'Radio',
                        'textarea': 'Área de Texto',
                        'number': 'Número',
                        'número': 'Número',
                        'email': 'Email',
                        'url': 'URL',
                        'multiselect': 'Seleção Múltipla',
                        'file': 'Arquivo',
                        'switch': 'Switch',
                        'slider': 'Slider',
                        'color': 'Cor',
                        'time': 'Hora',
                        'datetime': 'Data e Hora'
                    }
                    const displayTipo = tipoMap[tipo.toLowerCase()] || tipo
                    
                    const colorClass = {
                        'Texto': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                        'Número': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                        'Data': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                        'Dropdown': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                        'Checkbox': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
                        'Radio': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
                        'Área de Texto': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                        'Email': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
                        'URL': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
                        'Seleção Múltipla': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                        'Arquivo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                        'Switch': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
                        'Slider': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
                        'Cor': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
                        'Hora': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                        'Data e Hora': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }[displayTipo] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    
                    return (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
                            {displayTipo}
                        </span>
                    )
                }
            },
            { 
                header: 'Obrigatório', 
                accessorKey: 'obrigatorio',
                cell: (props) => (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        props.getValue() 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                        {props.getValue() ? 'Sim' : 'Não'}
                    </span>
                )
            },
            { 
                header: 'Pesquisável', 
                accessorKey: 'pesquisavel',
                cell: (props) => (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        props.getValue() 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                        {props.getValue() ? 'Sim' : 'Não'}
                    </span>
                )
            },
            { 
                header: 'Ativo', 
                accessorKey: 'ativo',
                cell: (props) => {
                    const field = props.row.original
                    return (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            <Switcher
                                defaultChecked={field.ativo}
                                onChange={(checked) => {
                                    const { updateField } = useFieldConfigStore.getState()
                                    updateField(field.id, { ativo: checked })
                                }}
                            />
                        </div>
                    )
                }
            },
            { 
                header: 'Remover', 
                accessorKey: 'remove',
                cell: (props) => {
                    const field = props.row.original
                    const FIXED_FIELD_NAMES = ['name', 'atendente', 'pendencias']
                    const isFixed = FIXED_FIELD_NAMES.includes(field.fieldName)
                    return (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            {isFixed ? (
                                <span className="text-xs text-gray-400">Fixo</span>
                            ) : (
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<TbTrash />}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteField(field)
                                    }}
                                />
                            )}
                        </div>
                    )
                }
            },
        ],
        [],
    )

    const table = useReactTable({
        data: fieldConfig,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <>
            <style jsx global>{`
                .settings-drawer .drawer-content {
                    left: 4rem !important;
                    right: 4rem !important;
                    width: auto !important;
                    border-radius: 1rem 1rem 0 0 !important;
                }
            `}</style>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h3>Fluxo de Escrituras</h3>
                        <p className="font-semibold">Tabelionato de Notas</p>
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<TbPlus />}
                        onClick={handleAddNewTask}
                    >
                        Adicionar Projeto
                    </Button>
                    <div className="flex items-center">
                        <div className="relative">
                            <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                size="sm"
                                placeholder="Buscar projetos..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10 w-64"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <UsersAvatarGroup
                            className="flex items-center"
                            avatarProps={{ size: 35 }}
                            users={displayUsers || []}
                        />
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    icon={<TbUserPlus />}
                                    onClick={onAddMember}
                                />
                            )}
                            <Button
                                size="sm"
                                icon={<TbSettings />}
                                onClick={openSettingsDrawer}
                            />
                            <Dropdown
                                placement="bottom-end"
                                renderTitle={
                                    <Button size="sm">
                                        <div className="flex items-center">
                                            <span>{getViewLabel()}</span>
                                            <TbChevronDown className="ml-1" />
                                        </div>
                                    </Button>
                                }
                            >
                                <Dropdown.Item
                                    eventKey="em-andamento"
                                    onSelect={() => handleViewChange('em-andamento')}
                                >
                                    Em Andamento
                                </Dropdown.Item>
                                <Dropdown.Item
                                    eventKey="finalizados"
                                    onSelect={() => handleViewChange('finalizados')}
                                >
                                    Finalizados
                                </Dropdown.Item>
                            </Dropdown>
                            <Button
                                size="sm"
                                icon={<TbPlus />}
                                onClick={handleAddNewColumn}
                            >
                                <span>Novo Quadro</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Settings Drawer */}
            <Drawer
                title={
                    <div className="flex items-center justify-between w-full">
                        <h3>Configurações do Kanban</h3>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<TbPlus />}
                            className="ml-4"
                            onClick={() => {
                                setEditFormData({
                                    name: '',
                                    type: '',
                                    mandatory: false,
                                    searchable: false,
                                    ativo: true,
                                    visibleInBoard: false,
                                    options: []
                                })
                                setNewOption('')
                                setIsAddFieldDialogOpen(true)
                            }}
                        >
                            Adicionar Campo
                        </Button>
                    </div>
                }
                isOpen={isSettingsDrawerOpen}
                placement="bottom"
                height={900}
                className="mb-0 settings-drawer"
                onClose={closeSettingsDrawer}
                onRequestClose={closeSettingsDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeSettingsDrawer}>
                            Cancelar
                        </Button>
                        <Button size="sm" variant="solid" onClick={closeSettingsDrawer}>
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <div className="p-4 h-full overflow-y-auto">
                    {fieldsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-gray-500">Carregando configurações de campos...</div>
                        </div>
                    ) : (
                        <Table className="w-full">
                        <THead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <Th key={header.id} colSpan={header.colSpan}>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                            </Th>
                                        )
                                    })}
                                </Tr>
                            ))}
                        </THead>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="table-body">
                                {(provided) => (
                                    <TBody
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        suppressHydrationWarning
                                    >
                                        {table.getRowModel().rows.map((row) => {
                                            return (
                                                <Draggable
                                                    key={row.id}
                                                    draggableId={row.id}
                                                    index={row.index}
                                                >
                                                    {(provided, snapshot) => {
                                                        const { style } = provided.draggableProps
                                                        return (
                                                            <Tr
                                                                ref={provided.innerRef}
                                                                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                                                    snapshot.isDragging
                                                                        ? 'opacity-50'
                                                                        : ''
                                                                }`}
                                                                style={style}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => openEditDialog(row.original)}
                                                            >
                                                                {row
                                                                    .getVisibleCells()
                                                                    .map((cell) => {
                                                                        return (
                                                                            <Td
                                                                                key={cell.id}
                                                                            >
                                                                                {flexRender(
                                                                                    cell.column.columnDef.cell,
                                                                                    cell.getContext(),
                                                                                )}
                                                                            </Td>
                                                                        )
                                                                    })}
                                                            </Tr>
                                                        )
                                                    }}
                                                </Draggable>
                                            )
                                        })}
                                        {provided.placeholder}
                                    </TBody>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Table>
                    )}
                </div>
            </Drawer>

            {/* Edit Field Dialog */}
            <Dialog
                isOpen={isEditDialogOpen}
                onClose={closeEditDialog}
                onRequestClose={closeEditDialog}
                contentClassName="pb-0 px-0"
            >
                <div className="px-6 pb-6">
                    <h5 className="mb-4">Editar Campo</h5>
                    <Form onSubmit={(e) => e.preventDefault()}>
                        <FormItem
                            label="Nome do Campo"
                            asterisk
                        >
                            <Input
                                value={editFormData.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                placeholder="Digite o nome do campo"
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Tipo do Campo"
                            asterisk
                        >
                            <Select
                                options={fieldTypeOptions}
                                value={fieldTypeOptions.find(option => option.value === editFormData.type)}
                                onChange={(option) => handleEditFormChange('type', option?.value || '')}
                                placeholder="Selecione o tipo do campo"
                            />
                        </FormItem>

                        {/* Options Configuration */}
                        {needsOptions(editFormData.type) && (
                            <div className="mt-4">
                                <FormItem label="Opções do Campo">
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newOption}
                                                onChange={(e) => setNewOption(e.target.value)}
                                                placeholder="Digite uma opção..."
                                                onKeyPress={(e) => e.key === 'Enter' && addOption()}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={addOption}
                                                disabled={!newOption.trim()}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                        
                                        {editFormData.options.length > 0 && (
                                            <div className="space-y-1">
                                                {editFormData.options.map((option, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">{option.label}</span>
                                                            {option.color && (
                                                                <div 
                                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                                    style={{ backgroundColor: option.color }}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ColorPicker
                                                                value={option.color || 'lightblue'}
                                                                onChange={(color) => {
                                                                    const newOptions = [...editFormData.options]
                                                                    newOptions[index] = { ...option, color }
                                                                    handleEditFormChange('options', newOptions)
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="plain"
                                                                onClick={() => removeOption(index)}
                                                            >
                                                                <TbX />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </FormItem>
                            </div>
                        )}
                        
                        <div className="flex gap-6">
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.mandatory}
                                    onChange={(checked) => handleEditFormChange('mandatory', checked)}
                                >
                                    Obrigatório
                                </Checkbox>
                            </FormItem>
                            
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.searchable}
                                    onChange={(checked) => handleEditFormChange('searchable', checked)}
                                >
                                    Pesquisável
                                </Checkbox>
                            </FormItem>
                            
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.visibleInBoard}
                                    onChange={(checked) => handleEditFormChange('visibleInBoard', checked)}
                                >
                                    Visível no Quadro
                                </Checkbox>
                            </FormItem>
                        </div>
                    </Form>
                </div>
                <div className="text-right px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-bl-lg rounded-br-lg">
                    <Button
                        className="ltr:mr-2 rtl:ml-2"
                        onClick={closeEditDialog}
                    >
                        Cancelar
                    </Button>
                    <Button variant="solid" onClick={handleSaveEdit}>
                        Salvar
                    </Button>
                </div>
            </Dialog>

            {/* Add Field Dialog */}
            <Dialog
                isOpen={isAddFieldDialogOpen}
                onClose={closeAddFieldDialog}
                onRequestClose={closeAddFieldDialog}
                contentClassName="pb-0 px-0"
            >
                <div className="px-6 pb-6">
                    <h5 className="mb-4">Adicionar Novo Campo</h5>
                    <Form onSubmit={(e) => e.preventDefault()}>
                        <FormItem
                            label="Nome do Campo"
                            asterisk
                        >
                            <Input
                                value={editFormData.name}
                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Tipo do Campo"
                            asterisk
                        >
                            <Select
                                options={fieldTypeOptions}
                                value={fieldTypeOptions.find(option => option.value === editFormData.type)}
                                onChange={(option) => handleEditFormChange('type', option?.value || '')}
                                placeholder=""
                            />
                        </FormItem>

                        {/* Options Configuration */}
                        {needsOptions(editFormData.type) && (
                            <div className="mt-4">
                                <FormItem label="Opções do Campo">
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newOption}
                                                onChange={(e) => setNewOption(e.target.value)}
                                                placeholder="Digite uma opção..."
                                                onKeyPress={(e) => e.key === 'Enter' && addOption()}
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={addOption}
                                                disabled={!newOption.trim()}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                        
                                        {editFormData.options.length > 0 && (
                                            <div className="space-y-1">
                                                {editFormData.options.map((option, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">{option.label}</span>
                                                            {option.color && (
                                                                <div 
                                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                                    style={{ backgroundColor: option.color }}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ColorPicker
                                                                value={option.color || 'lightblue'}
                                                                onChange={(color) => {
                                                                    const newOptions = [...editFormData.options]
                                                                    newOptions[index] = { ...option, color }
                                                                    handleEditFormChange('options', newOptions)
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                variant="plain"
                                                                onClick={() => removeOption(index)}
                                                            >
                                                                <TbX />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </FormItem>
                            </div>
                        )}
                        
                        <div className="flex gap-6">
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.mandatory}
                                    onChange={(checked) => handleEditFormChange('mandatory', checked)}
                                >
                                    Obrigatório
                                </Checkbox>
                            </FormItem>
                            
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.searchable}
                                    onChange={(checked) => handleEditFormChange('searchable', checked)}
                                >
                                    Pesquisável
                                </Checkbox>
                            </FormItem>
                            
                            <FormItem>
                                <Checkbox
                                    checked={editFormData.visibleInBoard}
                                    onChange={(checked) => handleEditFormChange('visibleInBoard', checked)}
                                >
                                    Visível no Quadro
                                </Checkbox>
                            </FormItem>
                        </div>
                    </Form>
                </div>
                <div className="text-right px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-bl-lg rounded-br-lg">
                    <Button
                        className="ltr:mr-2 rtl:ml-2"
                        onClick={closeAddFieldDialog}
                    >
                        Cancelar
                    </Button>
                    <Button variant="solid" onClick={handleCreateField}>
                        Criar
                    </Button>
                </div>
            </Dialog>

            {/* Delete Field Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteConfirmDialogOpen}
                type="danger"
                title="Remover Campo"
                onClose={onConfirmDeleteClose}
                onRequestClose={onConfirmDeleteClose}
                onCancel={onConfirmDeleteClose}
                onConfirm={onConfirmDelete}
            >
                <p>Tem certeza que deseja remover o campo <strong>{fieldToDelete?.nome}</strong>? Esta ação não pode ser desfeita.</p>
            </ConfirmDialog>
        </>
    )
}

export default ScrumBoardHeader
