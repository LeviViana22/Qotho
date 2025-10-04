'use client'
import { useMemo } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import { useUserFormStore } from '../_store/userFormStore'
import isBrowser from '@/utils/isBrowser'

// Password validation schema
const passwordSchema = z.object({
    password: z
        .string()
        .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
        }),
    confirmPassword: z.string().min(1, { message: 'Confirme a senha' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
})

const AddUserSecurity = () => {
    const { addUser } = useUserStore()
    const { setFormData } = useUserFormStore()
    const isHydrated = useUserStoreHydrated()

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        control,
        watch,
    } = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    const password = watch('password')

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' }
        
        let strength = 0
        if (password.length >= 8) strength++
        if (/[a-z]/.test(password)) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/\d/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++

        const strengthLevels = [
            { strength: 0, label: 'Muito fraca', color: 'bg-red-500' },
            { strength: 1, label: 'Fraca', color: 'bg-red-400' },
            { strength: 2, label: 'Regular', color: 'bg-yellow-500' },
            { strength: 3, label: 'Boa', color: 'bg-yellow-400' },
            { strength: 4, label: 'Forte', color: 'bg-green-500' },
            { strength: 5, label: 'Muito forte', color: 'bg-green-600' },
        ]

        return strengthLevels[Math.min(strength, 5)]
    }

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

    const onSubmit = async (values) => {
        try {
            // Save password data to the form store
            setFormData('security', {
                password: values.password,
                confirmPassword: values.confirmPassword,
            })
            
            console.log('Password saved to form store:', values.password)
        } catch (error) {
            console.error('Error setting password:', error)
        }
    }

    // Show loading state while hydrating (only in browser)
    if (isBrowser && !isHydrated) {
        return (
            <>
                <h4 className="mb-8">Segurança</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Carregando...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <h4 className="mb-8">Segurança</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Senha"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Digite uma senha segura"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Password strength indicator */}
                {password && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Força da senha:</span>
                            <span className={`text-sm font-medium ${
                                passwordStrength.strength <= 2 ? 'text-red-600' :
                                passwordStrength.strength <= 3 ? 'text-yellow-600' :
                                'text-green-600'
                            }`}>
                                {passwordStrength.label}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <FormItem
                    label="Confirmar senha"
                    invalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirme a senha"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                    <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Requisitos da senha:
                    </h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Pelo menos 8 caracteres</li>
                        <li>• Pelo menos uma letra minúscula (a-z)</li>
                        <li>• Pelo menos uma letra maiúscula (A-Z)</li>
                        <li>• Pelo menos um número (0-9)</li>
                        <li>• Caracteres especiais são recomendados</li>
                    </ul>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                        disabled={!password || passwordStrength.strength < 3}
                    >
                        Definir senha
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default AddUserSecurity
