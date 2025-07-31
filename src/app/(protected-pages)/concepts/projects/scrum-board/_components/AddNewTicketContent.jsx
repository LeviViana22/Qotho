'use client'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Checkbox from '@/components/ui/Checkbox'
import Tabs from '@/components/ui/Tabs'
import Tag from '@/components/ui/Tag'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import CloseButton from '@/components/ui/CloseButton'
import ScrollBar from '@/components/ui/ScrollBar'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'
import { createCardObject } from '../utils'
import { TbPlus, TbX } from 'react-icons/tb'
import dayjs from 'dayjs'
import { useState } from 'react'

const { TabNav, TabList, TabContent } = Tabs

const validationSchema = z.object({
    title: z.string().min(1, 'Task title is required!'),
    description: z.string().optional(),
    assignedTo: z.string().min(1, 'Assigned to is required!'),
    label: z.string().min(1, 'Label is required!'),
    entryDate: z.date().optional(),
    empreendimento: z.string().min(1, 'Empreendimento is required!'),
    unidade: z.string().min(1, 'Unidade is required!'),
    matricula: z.string().min(1, 'Matrícula is required!'),
    ordem: z.string().min(1, 'Ordem is required!'),
    tipo: z.string().min(1, 'Tipo is required!'),
    natureza: z.string().min(1, 'Natureza is required!'),
    custas: z.string().min(1, 'Custas is required!'),
    vencimentoMatricula: z.string().optional(),
    envioEscritura: z.date().optional(),
    minutaAprovada: z.boolean().default(false),
})

const tipoOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'DIVERSAS', label: 'DIVERSAS' },
]

const custasOptions = [
    { value: 'ALPHA', label: 'ALPHA' },
    { value: 'CLIENTE', label: 'CLIENTE' },
]

const labelOptions = [
    { value: 'Urgente', label: 'Urgente', color: 'bg-red-200 text-red-900 border-red-300' },
    { value: 'Parada', label: 'Parada', color: 'bg-yellow-200 text-yellow-900 border-yellow-300' },
    { value: 'Normal', label: 'Normal', color: 'bg-green-200 text-green-900 border-green-300' },
]

const AddNewTicketContent = () => {
    const { columns, board, closeDialog, updateColumns, setSelectedBoard, boardMembers } =
        useScrumBoardStore()

    const [selectedLabels, setSelectedLabels] = useState([])

    const {
        control,
        formState: { errors },
        handleSubmit,
        watch,
        setValue,
    } = useForm({
        defaultValues: {
            title: '',
            description: '',
            assignedTo: '',
            label: '',
            entryDate: null,
            empreendimento: '',
            unidade: '',
            matricula: '',
            ordem: '',
            tipo: '',
            natureza: '',
            custas: '',
            vencimentoMatricula: '',
            envioEscritura: null,
            minutaAprovada: false,
        },
        resolver: zodResolver(validationSchema),
    })

    // Watch individual fields to prevent unnecessary re-renders
    const empreendimentoValue = watch('empreendimento')
    const unidadeValue = watch('unidade')
    const matriculaValue = watch('matricula')
    const ordemValue = watch('ordem')
    const naturezaValue = watch('natureza')
    const vencimentoMatriculaValue = watch('vencimentoMatricula')

    const handleLabelSelect = (labelValue) => {
        if (!selectedLabels.includes(labelValue)) {
            setSelectedLabels([...selectedLabels, labelValue])
        }
    }

    const handleLabelRemove = (labelValue) => {
        setSelectedLabels(selectedLabels.filter(label => label !== labelValue))
    }

    const handleClearField = (fieldName) => {
        setValue(fieldName, '')
    }

    const onFormSubmit = async (formData) => {
        const data = columns
        const newCard = createCardObject()
        newCard.name = formData.title ? formData.title : 'Untitled Task'
        newCard.description = formData.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
        newCard.assignedTo = formData.assignedTo
        newCard.labels = selectedLabels
        newCard.entryDate = formData.entryDate
        newCard.empreendimento = formData.empreendimento
        newCard.unidade = formData.unidade
        newCard.matricula = formData.matricula
        newCard.ordem = formData.ordem
        newCard.tipo = formData.tipo
        newCard.natureza = formData.natureza
        newCard.custas = formData.custas
        newCard.vencimentoMatricula = formData.vencimentoMatricula
        newCard.envioEscritura = formData.envioEscritura
        newCard.minutaAprovada = formData.minutaAprovada

        const newData = cloneDeep(data)
        newData[board].push(newCard)
        updateColumns(newData)
        closeDialog()
        await sleep(1000)
        setSelectedBoard('')
    }

    return (
        <div>
            {/* Header */}
            <div className="flex gap-2 mb-10">
                <div className="w-full">
                    <div className="flex justify-between">
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter task title"
                                    className="text-xl font-bold border-0 p-0 bg-transparent focus:ring-0 focus:border-0"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <ScrollBar className="max-h-[700px] overflow-y-auto">
                <div className="flex flex-col gap-6">
                    {/* Assigned to */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Assigned to:
                        </div>
                        <div className="flex items-center gap-1">
                            <UsersAvatarGroup avatarProps={{ size: 25 }} users={boardMembers} />
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
                                {boardMembers.map((member) => (
                                    <Dropdown.Item
                                        key={member.id}
                                        eventKey={member.id}
                                        onSelect={() => {}}
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
                                        </div>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown>
                        </div>
                    </div>

                    {/* Label */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Label:
                        </div>
                        <div className="flex items-center gap-1">
                            {selectedLabels.map((labelValue) => {
                                const labelOption = labelOptions.find(option => option.value === labelValue)
                                return (
                                    <Tag
                                        key={labelValue}
                                        className={`${labelOption?.color} cursor-pointer`}
                                        onClick={() => handleLabelRemove(labelValue)}
                                    >
                                        {labelOption?.label}
                                    </Tag>
                                )
                            })}
                            <Dropdown
                                renderTitle={
                                    <Tag
                                        className="border-dashed cursor-pointer border-2 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-500 hover:border-primary hover:text-primary"
                                        prefix={<TbPlus />}
                                    >
                                        Add Label
                                    </Tag>
                                }
                                placement="bottom-end"
                            >
                                {labelOptions
                                    .filter(option => !selectedLabels.includes(option.value))
                                    .map((label) => (
                                        <Dropdown.Item
                                            key={label.value}
                                            eventKey={label.value}
                                            onSelect={() => handleLabelSelect(label.value)}
                                        >
                                            <div className="flex items-center">
                                                <span className="ml-2 rtl:mr-2">
                                                    {label.label}
                                                </span>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                            </Dropdown>
                        </div>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Due date:
                        </div>
                        <Controller
                            name="entryDate"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    placeholder="Select due date"
                                    inputFormat="DD/MM/YYYY"
                                    clearable={true}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Minuta Aprovada */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Minuta Aprovada:
                        </div>
                        <Controller
                            name="minutaAprovada"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Empreendimento */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Empreendimento:
                        </div>
                        <Controller
                            name="empreendimento"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter empreendimento"
                                    suffix={
                                        empreendimentoValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('empreendimento')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Unidade */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Unidade:
                        </div>
                        <Controller
                            name="unidade"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter unidade"
                                    suffix={
                                        unidadeValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('unidade')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Matrícula */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Matrícula:
                        </div>
                        <Controller
                            name="matricula"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter matrícula"
                                    suffix={
                                        matriculaValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('matricula')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Ordem */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Ordem:
                        </div>
                        <Controller
                            name="ordem"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter ordem"
                                    suffix={
                                        ordemValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('ordem')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Tipo */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Tipo:
                        </div>
                        <Controller
                            name="tipo"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select tipo"
                                    options={tipoOptions}
                                    clearable={true}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Natureza */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Natureza:
                        </div>
                        <Controller
                            name="natureza"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter natureza"
                                    suffix={
                                        naturezaValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('natureza')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Custas */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Custas:
                        </div>
                        <Controller
                            name="custas"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select custas"
                                    options={custasOptions}
                                    clearable={true}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Vencimento Matrícula */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Vencimento Matrícula:
                        </div>
                        <Controller
                            name="vencimentoMatricula"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter vencimento matrícula"
                                    suffix={
                                        vencimentoMatriculaValue ? (
                                            <button
                                                type="button"
                                                onClick={() => handleClearField('vencimentoMatricula')}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <TbX />
                                            </button>
                                        ) : null
                                    }
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Envio Escritura */}
                    <div className="flex items-center min-h-[30px]">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Envio Escritura:
                        </div>
                        <Controller
                            name="envioEscritura"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    placeholder="Select envio escritura date"
                                    inputFormat="DD/MM/YYYY"
                                    clearable={true}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div className="flex">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                            Description:
                        </div>
                        <div className="flex">
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        className="input input-md focus:ring-primary focus-within:ring-primary focus-within:border-primary focus:border-primary input-textarea w-full"
                                        placeholder="Enter description"
                                        rows={4}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs className="mt-6" defaultValue="comments">
                    <TabList>
                        <TabNav value="comments">Comments</TabNav>
                        <TabNav value="attachments">Attachments</TabNav>
                    </TabList>
                    <div className="p-4">
                        <TabContent value="comments">
                            <div className="w-full">
                                <div className="mb-3 flex gap-2">
                                    <Avatar src="/img/avatars/thumb-1.jpg" size="md" />
                                    <div className="w-full relative">
                                        <textarea
                                            className="input input-md h-12 focus:ring-primary focus-within:ring-primary focus-within:border-primary focus:border-primary input-textarea w-full"
                                            type="text"
                                            placeholder="Write comment"
                                        />
                                        <div className="absolute bottom-4 right-4">
                                            <div className="cursor-pointer font-semibold text-primary">
                                                Send
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabContent>
                        <TabContent value="attachments">
                            <div className="w-full">
                                <p className="text-gray-500">No attachments yet</p>
                            </div>
                        </TabContent>
                    </div>
                </Tabs>
            </ScrollBar>

            {/* Action buttons */}
            <div className="text-right mt-4">
                <Button
                    variant="plain"
                    onClick={closeDialog}
                    className="mr-2 rtl:ml-2"
                >
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    onClick={handleSubmit(onFormSubmit)}
                >
                    Add Task
                        </Button>
            </div>
        </div>
    )
}

export default AddNewTicketContent
