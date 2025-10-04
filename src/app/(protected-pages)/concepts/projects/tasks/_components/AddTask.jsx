'use client'
import { useEffect, useState, useRef } from 'react'
import classNames from '@/utils/classNames'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Badge from '@/components/ui/Badge'
import DatePicker from '@/components/ui/DatePicker'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useTasksStore } from '../_store/tasksStore'
import { createCardObject, createUID, generateProjectId } from '../../scrum-board/utils'
import {
    TbPlus,
    TbCircleCheck,
    TbChevronDown,
    TbCalendar,
    TbUser,
} from 'react-icons/tb'
import dayjs from 'dayjs'

const { TBody, Tr, Td } = Table



const tipoOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'DIVERSAS', label: 'DIVERSAS' },
]

const custasOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'CLIENTE', label: 'CLIENTE' },
]

const AddTask = ({
    groupKey,
    isSelected,
    onSelect,
    onCreateTask,
    onDeselect,
}) => {
    const inputRef = useRef(null)

    const [focused, setFocused] = useState(false)

    const [title, setTitle] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [entryDate, setEntryDate] = useState(null)
    const [tipo, setTipo] = useState('')
    const [ordem, setOrdem] = useState('')
    const [eProtocolo, setEProtocolo] = useState('')
    const [empreendimento, setEmpreendimento] = useState('')
    const [unidade, setUnidade] = useState('')
    const [custas, setCustas] = useState('')
    const [natureza, setNatureza] = useState('')
    const [vencimentoMatricula, setVencimentoMatricula] = useState(null)
    const [codigoValidacaoITBI, setCodigoValidacaoITBI] = useState('')
    const [envioITBIEscritura, setEnvioITBIEscritura] = useState(null)
    const [itbiPago, setItbiPago] = useState(false)
    const [escrituraPago, setEscrituraPago] = useState(false)
    const [envioMinuta, setEnvioMinuta] = useState(null)
    const [minutaAprovada, setMinutaAprovada] = useState(false)
    const [dataLavratura, setDataLavratura] = useState(null)
    const [dataEnvioRegistro, setDataEnvioRegistro] = useState(null)
    const [statusONR, setStatusONR] = useState('')

    const { boardMembers, columns } = useTasksStore()

    useEffect(() => {
        if (isSelected) {
            inputRef.current?.focus()
        } else {
            // Reset form when deselected
            setTitle('')
            setAssignedTo('')
            setEntryDate(null)
            setTipo('')
            setOrdem('')
            setEProtocolo('')
            setEmpreendimento('')
            setUnidade('')
            setCustas('')
            setNatureza('')
            setVencimentoMatricula(null)
            setCodigoValidacaoITBI('')
            setEnvioITBIEscritura(null)
            setItbiPago(false)
            setEscrituraPago(false)
            setEnvioMinuta(null)
            setMinutaAprovada(false)
            setDataLavratura(null)
            setDataEnvioRegistro(null)
            setStatusONR('')
        }
    }, [isSelected])

    const handleCreateClick = () => {
        const newCard = createCardObject()
        
        // Generate project ID
        newCard.projectId = generateProjectId(columns)
        
        newCard.name = title || 'Untitled Task'
        newCard.assignedTo = assignedTo || ''
        newCard.tipo = tipo || ''
        newCard.entryDate = entryDate ? entryDate.toISOString() : null
        newCard.ordem = ordem || ''
        newCard.eProtocolo = eProtocolo || ''
        newCard.empreendimento = empreendimento || ''
        newCard.unidade = unidade || ''
        newCard.custas = custas || ''
        newCard.natureza = natureza || ''
        newCard.vencimentoMatricula = vencimentoMatricula ? vencimentoMatricula.toISOString() : null
        newCard.codigoValidacaoITBI = codigoValidacaoITBI || ''
        newCard.envioITBIEscritura = envioITBIEscritura ? envioITBIEscritura.toISOString() : null
        newCard.itbiPago = itbiPago
        newCard.escrituraPago = escrituraPago
        newCard.envioMinuta = envioMinuta ? envioMinuta.toISOString() : null
        newCard.minutaAprovada = minutaAprovada
        newCard.dataLavratura = dataLavratura ? dataLavratura.toISOString() : null
        newCard.dataEnvioRegistro = dataEnvioRegistro ? dataEnvioRegistro.toISOString() : null
        newCard.statusONR = statusONR || ''
        newCard.comments = []
        newCard.attachments = []
        newCard.pendingItems = []

        // Add assigned member if selected
        if (assignedTo) {
            const member = boardMembers.find(m => m.id === assignedTo)
            if (member) {
                newCard.members = [member]
            }
        }

        onCreateTask(groupKey, newCard)
        
        // Reset form
        setTitle('')
        setAssignedTo('')
        setEntryDate(null)
        setTipo('')
        setOrdem('')
        setEProtocolo('')
        setEmpreendimento('')
        setUnidade('')
        setCustas('')
        setNatureza('')
        setVencimentoMatricula(null)
        setCodigoValidacaoITBI('')
        setEnvioITBIEscritura(null)
        setItbiPago(false)
        setEscrituraPago(false)
        setEnvioMinuta(null)
        setMinutaAprovada(false)
        setDataLavratura(null)
        setDataEnvioRegistro(null)
        setStatusONR('')
        
        // Deselect the form
        onDeselect?.()
    }



    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleCreateClick()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            onDeselect?.()
        }
    }

    return (
        <>
            {isSelected ? (
                <>
                    <div
                        className={classNames(
                            'rounded-lg transition-shadow duration-150',
                            focused && 'shadow-xl',
                        )}
                    >
                        <Table hoverable={false} overflow={false}>
                            <TBody>
                                <Tr>
                                    <Td className="w-[66px]"></Td>
                                    <Td className="w-[40px] text-2xl">
                                        <TbCircleCheck />
                                    </Td>
                                    <Td className="w-[300px]">
                                        <input
                                            ref={inputRef}
                                            className="outline-0 font-semibold w-full heading-text bg-transparent"
                                            placeholder="Nome do Projeto"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                            onKeyDown={handleKeyDown}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </Td>
                                    <Td className="w-[150px]">
                                        <Dropdown
                                            renderTitle={
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    {assignedTo ? (
                                                        <>
                                                            <Avatar
                                                                shape="circle"
                                                                size="sm"
                                                                src={boardMembers.find((member) => member.id === assignedTo)?.img}
                                                            />
                                                            <span className="font-bold heading-text">
                                                                {boardMembers.find((member) => member.id === assignedTo)?.name}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TbUser className="text-xl" />
                                                            <span className="font-semibold">Atendente</span>
                                                        </>
                                                    )}
                                                </div>
                                            }
                                        >
                                            {boardMembers.map((member) => (
                                                <Dropdown.Item
                                                    key={member.name}
                                                    eventKey={member.id}
                                                    onSelect={() => setAssignedTo(member.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <Avatar
                                                                shape="circle"
                                                                size={22}
                                                                src={member.img}
                                                            />
                                                            <span className="ml-2 rtl:mr-2">
                                                                {member.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown>
                                    </Td>
                                    <Td className="w-[150px]">
                                        <div className="flex items-center gap-2 cursor-pointer relative max-w-[200px]">
                                            <TbCalendar className="text-xl" />
                                            <span className="font-semibold">
                                                {entryDate
                                                    ? dayjs(entryDate).format('DD/MM/YYYY')
                                                    : 'Data de Entrada'}
                                            </span>
                                            <DatePicker
                                                className="opacity-0 cursor-pointer absolute"
                                                value={entryDate || new Date()}
                                                inputtable={false}
                                                inputPrefix={null}
                                                inputSuffix={null}
                                                clearable={true}
                                                onChange={(date) => setEntryDate(date)}
                                            />
                                        </div>
                                    </Td>
                                    <Td className="w-[120px]">
                                        <Dropdown
                                            renderTitle={
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    {tipo ? (
                                                        <span className="font-semibold">{tipo}</span>
                                                    ) : (
                                                        <span className="font-semibold">Tipo</span>
                                                    )}
                                                    <TbChevronDown className="text-lg" />
                                                </div>
                                            }
                                            placement="bottom-end"
                                        >
                                            {tipoOptions.map((tipoItem) => (
                                                <Dropdown.Item
                                                    key={tipoItem.value}
                                                    eventKey={tipoItem.value}
                                                    onSelect={setTipo}
                                                >
                                                    <span>{tipoItem.label}</span>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown>
                                    </Td>
                                    <Td className="w-[120px]">
                                        <input
                                            className="outline-0 font-semibold w-full bg-transparent"
                                            placeholder="Unidade"
                                            value={unidade}
                                            onChange={(e) => setUnidade(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </Td>
                                    <Td className="w-[120px]">
                                        <input
                                            className="outline-0 font-semibold w-full bg-transparent"
                                            placeholder="Natureza"
                                            value={natureza}
                                            onChange={(e) => setNatureza(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </Td>
                                    <Td className="py-1">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                onClick={handleCreateClick}
                                            >
                                                Criar
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            </TBody>
                        </Table>
                    </div>
                </>
            ) : (
                <Button
                    block
                    icon={<TbPlus />}
                    customColorClass={() =>
                        'border-dashed border-2 hover:ring-transparent bg-gray-50'
                    }
                    onClick={() => onSelect(groupKey)}
                >
                    Adicionar Projeto
                </Button>
            )}
        </>
    )
}

export default AddTask
