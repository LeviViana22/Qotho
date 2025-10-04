'use client'
import { useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import TimeInput from '@/components/ui/TimeInput'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import Badge from '@/components/ui/Badge'
import hooks from '@/components/ui/hooks'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TbChecks } from 'react-icons/tb'
import { components } from 'react-select'
import dayjs from 'dayjs'

const { Control } = components

const { useUniqueId } = hooks

const colorOptions = [
    {
        value: 'red',
        label: 'vermelho',
        color: 'bg-red-400',
    },
    {
        value: 'orange',
        label: 'laranja',
        color: 'bg-orange-400',
    },
    {
        value: 'yellow',
        label: 'amarelo',
        color: 'bg-yellow-400',
    },
    {
        value: 'green',
        label: 'verde',
        color: 'bg-green-400',
    },
    {
        value: 'blue',
        label: 'azul',
        color: 'bg-blue-400',
    },
    {
        value: 'purple',
        label: 'roxo',
        color: 'bg-purple-400',
    },
]

const CustomSelectOption = ({ innerProps, label, data, isSelected }) => {
    return (
        <div
            className={`flex items-center justify-between rounded-lg p-2 ${
                isSelected
                    ? 'bg-gray-100 dark:bg-gray-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            {...innerProps}
        >
            <div className="flex items-center">
                <Badge className={data.color} />
                <span className="ml-2 rtl:mr-2 capitalize">{label}</span>
            </div>
            {isSelected && <TbChecks className="text-emerald-500 text-xl" />}
        </div>
    )
}

const CustomControl = ({ children, ...props }) => {
    const selected = props.getValue()[0]

    return (
        <Control className="capitalize" {...props}>
            {selected && (
                <Badge className={`${selected.color} ltr:ml-4 rtl:mr-4`} />
            )}
            {children}
        </Control>
    )
}

const validationSchema = z.object({
    title: z.string().min(1, { message: 'Event title required' }),
    startDate: z.date({
        required_error: 'Please select a date',
        invalid_type_error: "That's not a date!",
    }),
    eventTime: z.date({
        required_error: 'Please select a time',
        invalid_type_error: "That's not a valid time!",
    }),
    color: z.string().min(1, { message: 'Color required' }),
})

const EventDialog = (props) => {
    const { submit, open, selected, onDialogOpen, onDelete } = props

    const newId = useUniqueId('event-')

    const handleDialogClose = () => {
        onDialogOpen(false)
    }

    const handleDelete = () => {
        if (selected.type === 'EDIT' && selected.id) {
            onDelete?.(selected.id)
            handleDialogClose()
        }
    }

    const onSubmit = (values) => {
        // Combine start date with selected time
        const startDate = dayjs(values.startDate)
        const eventTime = dayjs(values.eventTime)
        
        // Create the start datetime by combining date and time
        const startDateTime = startDate
            .hour(eventTime.hour())
            .minute(eventTime.minute())
            .second(0)
            .millisecond(0)

        const eventData = {
            id: selected.id || newId,
            title: values.title,
            start: startDateTime.format(),
            eventColor: values.color,
            // Store the time for display purposes
            eventTime: eventTime.format('HH:mm'),
        }
        
        console.log('eventData', eventData)
        submit?.(eventData, selected.type)
        handleDialogClose()
    }

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (selected) {
            const startDate = selected.start ? dayjs(selected.start) : null
            reset({
                title: selected.title || '',
                startDate: startDate ? startDate.toDate() : null,
                eventTime: startDate ? startDate.toDate() : new Date(),
                color: selected.eventColor || colorOptions[0].value,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    return (
        <Dialog
            isOpen={open}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h5 className="mb-4">
                {selected.type === 'NEW' ? 'Adicionar novo evento' : 'Editar evento'}
            </h5>
            <Form
                className="flex-1 flex flex-col"
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormItem
                    label="Nome do evento"
                    invalid={Boolean(errors.title)}
                    errorMessage={errors.title?.message}
                >
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Nome do evento"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Data de início"
                    invalid={Boolean(errors.startDate)}
                    errorMessage={errors.startDate?.message}
                >
                    <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                inputFormat="DD/MM/YYYY"
                                placeholder="DD/MM/YYYY"
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Horário"
                    invalid={Boolean(errors.eventTime)}
                    errorMessage={errors.eventTime?.message}
                >
                    <Controller
                        name="eventTime"
                        control={control}
                        render={({ field }) => (
                            <TimeInput
                                value={field.value}
                                onChange={field.onChange}
                                format="24"
                                showSeconds={false}
                                placeholder="Selecione o horário"
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Cor"
                    asterisk={true}
                    invalid={Boolean(errors.color)}
                    errorMessage={errors.color?.message}
                >
                    <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                            <Select
                                instanceId="event-color"
                                options={colorOptions}
                                value={colorOptions.filter(
                                    (option) => option.value === field.value,
                                )}
                                components={{
                                    Option: CustomSelectOption,
                                    Control: CustomControl,
                                }}
                                onChange={(selected) => {
                                    field.onChange(selected?.value)
                                }}
                            />
                        )}
                    />
                </FormItem>
                <FormItem className="mb-0 text-right rtl:text-left">
                    <div className="flex gap-2">
                        {selected.type === 'EDIT' && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={handleDelete}
                            >
                                Excluir
                            </Button>
                        )}
                        <Button block variant="solid" type="submit">
                            {selected.type === 'NEW' ? 'Criar' : 'Atualizar'}
                        </Button>
                    </div>
                </FormItem>
            </Form>
        </Dialog>
    )
}

export default EventDialog
