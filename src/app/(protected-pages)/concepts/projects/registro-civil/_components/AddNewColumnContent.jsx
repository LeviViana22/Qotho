'use client'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useRegistroCivilStore } from '../_store/registroCivilStore'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'

const validationSchema = z.object({
    title: z.string().min(1, 'Column title is required!'),
})

const AddNewColumnContent = () => {
    const {
        columns,
        ordered,
        closeDialog,
        updateColumns,
        resetView,
        updateOrdered,
    } = useRegistroCivilStore()

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm({
        defaultValues: {
            title: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const onFormSubmit = async ({ title }) => {
        try {
            // Get current boards to determine the next color
            const response = await fetch('/api/projects/registro-civil')
            const responseData = response.ok ? await response.json() : { boards: {}, boardOrder: [] }
            const currentBoards = responseData.boards || {}
            const currentBoardNames = Object.keys(currentBoards)
            
            // Define color sequence based on the existing color mappings
            const colorSequence = [
                'gray', 'purple', 'blue', 'yellow', 'pink', 'indigo', 'green', 'orange', 'red'
            ]
            
            // Determine the next color based on current board count
            const nextColorIndex = currentBoardNames.length % colorSequence.length
            const nextColor = colorSequence[nextColorIndex]
            
            console.log(`Creating new board "${title}" with color: ${nextColor}`)
            
            // Create the new board using the dedicated endpoint
            const saveResponse = await fetch('/api/projects/registro-civil/add-board', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ boardName: title }),
            })
            
            if (saveResponse.ok) {
                console.log('New board created successfully')
                
                // Update local state
                const data = cloneDeep(currentBoards)
                data[title] = []
                const newOrdered = [...Object.keys(currentBoards), title]
                const newColumns = {}
                
                newOrdered.forEach((elm) => {
                    newColumns[elm] = data[elm]
                })
                
                updateColumns(newColumns)
                updateOrdered(newOrdered)
                
                // Don't refresh from database immediately as it would override the correct order
                // The database has the board, but the local state has the correct order
                
                closeDialog()
                await sleep(500)
                resetView()
            } else {
                const errorData = await saveResponse.json()
                console.error('Failed to create new board:', errorData.error)
                
                // Still update local state even if database save fails
                const data = cloneDeep(currentBoards)
                data[title] = []
                const newOrdered = [...Object.keys(currentBoards), title]
                const newColumns = {}
                
                newOrdered.forEach((elm) => {
                    newColumns[elm] = data[elm]
                })
                
                updateColumns(newColumns)
                updateOrdered(newOrdered)
                
                closeDialog()
                await sleep(500)
                resetView()
            }
        } catch (error) {
            console.error('Error creating new board:', error)
            // Fallback to local state update only
            const data = cloneDeep(columns)
            data[title ? title : 'Untitled Board'] = []
            const newOrdered = [...ordered, ...[title ? title : 'Untitled Board']]
            const newColumns = {}

            newOrdered.forEach((elm) => {
                newColumns[elm] = data[elm]
            })

            updateColumns(newColumns)
            updateOrdered(newOrdered)
            
            closeDialog()
            await sleep(500)
            resetView()
        }
    }

    return (
        <div>
            <h5>Adicionar Novo Quadro</h5>
            <div className="mt-8">
                <Form layout="inline" onSubmit={handleSubmit(onFormSubmit)}>
                    <FormItem
                        label="Título"
                        invalid={Boolean(errors.title)}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem>
                        <Button variant="solid" type="submit">
                            Adicionar
                        </Button>
                    </FormItem>
                </Form>
            </div>
        </div>
    )
}

export default AddNewColumnContent

