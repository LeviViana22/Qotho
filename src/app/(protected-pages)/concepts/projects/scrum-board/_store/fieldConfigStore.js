'use client'
import { create } from 'zustand'

// Field names that are fixed and cannot be edited or removed
const FIXED_FIELD_NAMES = ['name', 'atendente', 'pendencias']

export const useFieldConfigStore = create(
    (set, get) => ({
        fieldConfig: [],
        isLoading: false,
        isInitialized: false,
            
        // Load field configurations from database
        loadFieldConfigs: async () => {
            set({ isLoading: true })
            try {
                const response = await fetch('/api/field-configs')
                if (response.ok) {
                    const data = await response.json()
                    set({ fieldConfig: data.fieldConfigs, isInitialized: true })
                } else {
                    console.error('Failed to load field configurations')
                    set({ fieldConfig: [], isInitialized: true })
                }
            } catch (error) {
                console.error('Error loading field configurations:', error)
                set({ fieldConfig: [], isInitialized: true })
            } finally {
                set({ isLoading: false })
            }
        },
        
        updateFieldConfig: (newConfig) => {
            set({ fieldConfig: newConfig })
        },
        
        updateField: async (fieldId, updates) => {
            // Don't allow updating fixed fields
            const field = get().fieldConfig.find(f => f.id === fieldId)
            if (field && FIXED_FIELD_NAMES.includes(field.fieldName)) {
                console.warn('Cannot update fixed fields')
                return
            }

            try {
                console.log('Updating field:', fieldId, 'with updates:', updates)
                const response = await fetch(`/api/field-configs/${fieldId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('Field updated successfully:', data)
                    const { fieldConfig } = get()
                    const updatedConfig = fieldConfig.map(field => 
                        field.id === fieldId 
                            ? { ...field, ...data.fieldConfig }
                            : field
                    )
                    set({ fieldConfig: updatedConfig })
                } else {
                    const errorText = await response.text()
                    console.error('Failed to update field configuration:', response.status, errorText)
                }
            } catch (error) {
                console.error('Error updating field configuration:', error)
            }
        },
        
        getFieldByName: (fieldName) => {
            const { fieldConfig } = get()
            return fieldConfig.find(field => field.fieldName === fieldName)
        },
        
        getVisibleFields: () => {
            const { fieldConfig } = get()
            return fieldConfig.filter(field => field.visible !== false)
        },
        
        getActiveFields: () => {
            const { fieldConfig } = get()
            return fieldConfig.filter(field => field.ativo !== false)
        },
        
        reorderFields: async (startIndex, endIndex) => {
            const { fieldConfig } = get()
            const newConfig = [...fieldConfig]
            const [movedField] = newConfig.splice(startIndex, 1)
            newConfig.splice(endIndex, 0, movedField)
            
            // Update local state immediately
            set({ fieldConfig: newConfig })
            
            // Update order in database
            try {
                const fieldOrders = newConfig
                    .filter(field => !FIXED_FIELD_NAMES.includes(field.fieldName)) // Only update non-fixed fields
                    .map((field, index) => ({ id: field.id, order: index }))
                
                if (fieldOrders.length > 0) {
                    await fetch('/api/field-configs/reorder', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ fieldOrders }),
                    })
                }
            } catch (error) {
                console.error('Error reordering field configurations:', error)
            }
        },
        
        addField: async (fieldData) => {
            try {
                const response = await fetch('/api/field-configs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nome: fieldData.name,
                        tipo: fieldData.type,
                        obrigatorio: fieldData.mandatory,
                        pesquisavel: fieldData.searchable,
                        ativo: fieldData.ativo,
                        visivelNoQuadro: fieldData.visibleInBoard || false,
                        fieldName: fieldData.name.toLowerCase().replace(/\s+/g, ''),
                        options: fieldData.options || [],
                        order: 0 // Will be set by reorder function
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    const { fieldConfig } = get()
                    set({ fieldConfig: [...fieldConfig, data.fieldConfig] })
                } else {
                    console.error('Failed to create field configuration')
                }
            } catch (error) {
                console.error('Error creating field configuration:', error)
            }
        },
        
        removeField: async (fieldId) => {
            // Don't allow removing fixed fields
            const field = get().fieldConfig.find(f => f.id === fieldId)
            if (field && FIXED_FIELD_NAMES.includes(field.fieldName)) {
                console.warn('Cannot remove fixed fields')
                return
            }

            try {
                const response = await fetch(`/api/field-configs/${fieldId}`, {
                    method: 'DELETE',
                })

                if (response.ok) {
                    const { fieldConfig } = get()
                    const updatedConfig = fieldConfig.filter(field => field.id !== fieldId)
                    set({ fieldConfig: updatedConfig })
                } else {
                    console.error('Failed to delete field configuration')
                }
            } catch (error) {
                console.error('Error deleting field configuration:', error)
            }
        }
    })
)
