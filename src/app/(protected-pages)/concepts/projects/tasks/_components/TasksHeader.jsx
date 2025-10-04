'use client'
import { useState, useRef, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import ScrollBar from '@/components/ui/ScrollBar'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Dropdown from '@/components/ui/Dropdown'
import Slider from '@/components/ui/Slider'
import wildCardSearch from '@/utils/wildCardSearch'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import { useTasksStore } from '../_store/tasksStore'
import { useScrumBoardStore } from '../../scrum-board/_store/scrumBoardStore'
import { TbSearch, TbPlus, TbChevronDown, TbSettings } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import debounce from 'lodash/debounce'
import cloneDeep from 'lodash/cloneDeep'

const TasksHeader = ({ columnWidths, onColumnWidthChange }) => {
    const inputRef = useRef(null)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false)

    const { 
        allMembers, 
        boardMembers, 
        updateBoardMembers,
        currentView,
        setCurrentView,
        searchQuery,
        setSearchQuery,
        syncWithScrumBoard,
        updateScrumBoard
    } = useTasksStore()

    const scrumBoardStore = useScrumBoardStore()

    const [memberList, setMemberList] = useState([])

    useEffect(() => {
        if (allMembers.length > 1) {
            setMemberList(allMembers)
        }
    }, [allMembers])

    // Synchronize with scrum board store
    useEffect(() => {
        // Get the current state from the scrum board store
        const scrumBoardState = useScrumBoardStore.getState()
        syncWithScrumBoard(() => scrumBoardState)
    }, [syncWithScrumBoard])

    // Atualizar diretamente o scrumBoardStore quando o tasksStore muda
    // Usamos um ref para evitar atualizações desnecessárias
    const prevValuesRef = useRef({ boardMembers, currentView, searchQuery })
    
    useEffect(() => {
        // Verificar se os valores realmente mudaram para evitar atualizações desnecessárias
        const prevValues = prevValuesRef.current
        const boardMembersChanged = JSON.stringify(prevValues.boardMembers) !== JSON.stringify(boardMembers)
        const currentViewChanged = prevValues.currentView !== currentView
        const searchQueryChanged = prevValues.searchQuery !== searchQuery
        
        if (scrumBoardStore && (boardMembersChanged || currentViewChanged || searchQueryChanged)) {
            // Atualizar diretamente o scrumBoardStore apenas se algo mudou
            if (boardMembersChanged) scrumBoardStore.updateBoardMembers(boardMembers)
            if (currentViewChanged) scrumBoardStore.setCurrentView(currentView)
            if (searchQueryChanged) scrumBoardStore.setSearchQuery(searchQuery)
            
            // Atualizar os valores de referência
            prevValuesRef.current = { boardMembers, currentView, searchQuery }
        }
    }, [boardMembers, currentView, searchQuery, scrumBoardStore])

    const debounceFn = debounce(handleDebounceFn, 500)

    function handleDebounceFn(query) {
        const data = wildCardSearch(allMembers, query, 'name')
        setMemberList(data)
    }

    const onSearch = (e) => {
        debounceFn(e.target.value)
    }

    const existingMember = (id) => {
        return boardMembers.some((member) => member.id === id)
    }

    const onAddMember = (member) => {
        const data = cloneDeep(boardMembers)
        data.push(member)
        updateBoardMembers(data)
    }

    const onRemoveMember = (id) => {
        const data = cloneDeep(boardMembers).filter(
            (member) => member.id !== id,
        )
        updateBoardMembers(data)
    }

    const onDone = () => {
        setDialogOpen(false)
    }

    const handleViewChange = (view) => {
        setCurrentView(view)
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    const handleColumnWidthChange = (columnName, value) => {
        if (onColumnWidthChange) {
            onColumnWidthChange(columnName, value)
        }
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3>Fluxo de Escrituras</h3>
                    <p className="font-semibold">Tabelionato de Notas</p>
                </div>
                <div className="flex items-center gap-2">
                    <UsersAvatarGroup
                        className="flex items-center"
                        avatarProps={{ size: 'sm' }}
                        users={boardMembers}
                    />
                    <Button
                        size="sm"
                        icon={<TbPlus />}
                        onClick={() => setDialogOpen(true)}
                    >
                        Adicionar Membros
                    </Button>
                </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                    <Dropdown
                        renderTitle={
                            <div className="flex items-center gap-2">
                                <Button size="sm">
                                    {currentView === 'em-andamento' ? 'Em Andamento' : 'Finalizados'}
                                </Button>
                                <TbChevronDown className="text-lg" />
                            </div>
                        }
                        placement="bottom-start"
                    >
                        <Dropdown.Item
                            eventKey="em-andamento"
                            onSelect={handleViewChange}
                        >
                            Em Andamento
                        </Dropdown.Item>
                        <Dropdown.Item
                            eventKey="finalizados"
                            onSelect={handleViewChange}
                        >
                            Finalizados
                        </Dropdown.Item>
                    </Dropdown>
                    <Button
                        size="sm"
                        icon={<TbSettings />}
                        onClick={() => setColumnSettingsOpen(true)}
                    >
                        Configurar Colunas
                    </Button>
                </div>
                
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Buscar projetos..."
                        prefix={<TbSearch className="text-lg" />}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-64"
                    />
                </div>
            </div>
            
            {/* Column Settings Dialog */}
            <Dialog
                isOpen={columnSettingsOpen}
                width={600}
                onClose={() => setColumnSettingsOpen(false)}
                onRequestClose={() => setColumnSettingsOpen(false)}
            >
                <div>
                    <div className="text-center mb-6">
                        <h4 className="mb-1">Configurar Largura das Colunas</h4>
                        <p>Ajuste a largura das colunas da tabela</p>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(columnWidths || {}).map(([columnName, width]) => (
                            <div key={columnName} className="flex items-center gap-4">
                                <div className="w-32 text-sm font-medium">
                                    {columnName}
                                </div>
                                <div className="flex-1">
                                    <Slider
                                        value={width}
                                        onChange={(value) => handleColumnWidthChange(columnName, value)}
                                        min={80}
                                        max={400}
                                        step={10}
                                    />
                                </div>
                                <div className="w-16 text-sm text-gray-500">
                                    {width}px
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-right">
                        <Button
                            variant="solid"
                            onClick={() => setColumnSettingsOpen(false)}
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </Dialog>
            
            {/* Add Members Dialog */}
            <Dialog
                isOpen={dialogOpen}
                width={520}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <div>
                    <div className="text-center mb-6">
                        <h4 className="mb-1">Adicionar Membros</h4>
                        <p>Adicione membros ao fluxo de escrituras.</p>
                    </div>
                    <Input
                        ref={inputRef}
                        prefix={<TbSearch className="text-lg" />}
                        placeholder="Pesquisar membro"
                        onChange={onSearch}
                    />
                    <div className="mt-4">
                        <p className="font-semibold uppercase text-xs mb-4">
                            {memberList.length} membros disponíveis
                        </p>
                        <div className="mb-6">
                            <ScrollBar
                                className={classNames('overflow-y-auto h-80')}
                            >
                                {memberList.map((member) => (
                                    <div
                                        key={member.id}
                                        className="py-3 pr-5 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                shape="circle"
                                                src={member.img}
                                            />
                                            <div>
                                                <p className="heading-text font-bold">
                                                    {member.name}
                                                </p>
                                            </div>
                                        </div>
                                        {existingMember(member.id) ? (
                                            <Button
                                                size="xs"
                                                customColorClass={() =>
                                                    'hover:border-red-500 hover:ring-red-500'
                                                }
                                                onClick={() =>
                                                    onRemoveMember(member.id)
                                                }
                                            >
                                                <span className="text-red-500">
                                                    Remover
                                                </span>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="xs"
                                                onClick={() =>
                                                    onAddMember(member)
                                                }
                                            >
                                                <span className="text-green-500">
                                                    Adicionar
                                                </span>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </ScrollBar>
                        </div>
                        <Button block variant="solid" onClick={onDone}>
                            Fechar
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default TasksHeader
