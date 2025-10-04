'use client'
import { useState, useRef, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import classNames from '@/utils/classNames'
import sleep from '@/utils/sleep'
import isLastChild from '@/utils/isLastChild'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import useUserStore from '@/stores/userStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const authenticatorList = [
    {
        label: 'Google Authenticator',
        value: 'googleAuthenticator',
        img: '/img/others/google.png',
        desc: 'Usando o aplicativo Google Authenticator, geramos códigos de acesso temporários para logins seguros.',
    },
    {
        label: 'Okta Verify',
        value: 'oktaVerify',
        img: '/img/others/okta.png',
        desc: 'Receba notificações push do aplicativo Okta Verify no seu telefone para aprovação rápida de logins.',
    },
    {
        label: 'Verificação por email',
        value: 'emailVerification',
        img: '/img/others/email.png',
        desc: 'Códigos únicos enviados para o email para confirmar logins.',
    },
]

// Create validation schema based on whether user is admin
const createValidationSchema = (isAdmin, isOwnPassword) => {
    const baseSchema = {
        newPassword: z
            .string()
            .min(8, { message: 'A nova senha deve ter pelo menos 8 caracteres!' })
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
                message: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número!' 
            }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'Por favor, confirme sua nova senha!' }),
    }

    // Only require current password if user is changing their own password
    if (isOwnPassword) {
        baseSchema.currentPassword = z
            .string()
            .min(1, { message: 'Por favor, digite sua senha atual!' })
    }

    return z.object(baseSchema)
        .refine((data) => data.confirmNewPassword === data.newPassword, {
            message: 'Senha não confere',
            path: ['confirmNewPassword'],
        })
        .refine((data) => !data.currentPassword || data.currentPassword !== data.newPassword, {
            message: 'A nova senha deve ser diferente da senha atual',
            path: ['newPassword'],
        })
}

const UserEditSecurity = ({ userId }) => {
    const { currentUser } = useUserStore()
    const [targetUser, setTargetUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const isAdmin = currentUser?.role === 'admin'
    const isOwnPassword = currentUser?.id === userId
    
    console.log('UserEditSecurity component mounted')
    console.log('userId:', userId)
    console.log('currentUser:', currentUser)
    console.log('targetUser:', targetUser)
    console.log('isAdmin:', isAdmin)
    console.log('isOwnPassword:', isOwnPassword)

    // Fetch user data from API (same as UserEditProfile)
    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return
            
            try {
                setLoading(true)
                console.log('Fetching user data for userId:', userId)
                const response = await fetch(`/api/users/${userId}`)
                if (response.ok) {
                    const data = await response.json()
                    console.log('User data fetched successfully:', data.user)
                    setTargetUser(data.user)
                } else {
                    console.error('Failed to fetch user:', response.statusText)
                    setTargetUser(null)
                }
            } catch (error) {
                console.error('Error fetching user:', error)
                setTargetUser(null)
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchUser()
        }
    }, [userId])
    
    const [selected2FaType, setSelected2FaType] = useState(
        'googleAuthenticator',
    )
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formRef = useRef(null)

    // Create dynamic validation schema
    const validationSchema = createValidationSchema(isAdmin, isOwnPassword)

    const {
        getValues,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    const handlePostSubmit = async () => {
        console.log('UserEditSecurity handlePostSubmit called')
        if (!targetUser) {
            console.log('No target user found')
            toast.push(
                <Notification type="danger">Usuário não encontrado.</Notification>,
                { placement: 'top-center' }
            )
            setConfirmationOpen(false)
            return
        }

        console.log('Target user found:', targetUser.id)
        setIsSubmitting(true)
        
        try {
            const { currentPassword, newPassword } = getValues()
            
            // Prepare request body
            const requestBody = { newPassword }
            if (isOwnPassword && currentPassword) {
                requestBody.currentPassword = currentPassword
            }
            
            console.log('Sending password update request:', { 
                userId: targetUser.id, 
                isOwnPassword, 
                hasCurrentPassword: !!currentPassword 
            })
            
            // Call API to update password
            const response = await fetch(`/api/users/${targetUser.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            console.log('API response status:', response.status)
            console.log('API response ok:', response.ok)
            
            const data = await response.json()
            console.log('API response data:', data)

            if (response.ok && data.success) {
                console.log('Password update successful, showing success toast')
                toast.push(
                    <Notification type="success">Senha atualizada com sucesso!</Notification>,
                    { placement: 'top-center' }
                )
                console.log('Success toast pushed')
            } else {
                // Show specific error message from API
                let errorMessage = 'Erro ao atualizar senha'
                
                if (response.status === 403) {
                    errorMessage = 'Acesso negado. Você não tem permissão para alterar a senha deste usuário.'
                } else if (response.status === 401) {
                    errorMessage = 'Não autorizado. Faça login novamente.'
                } else if (response.status === 404) {
                    errorMessage = 'Usuário não encontrado.'
                } else if (data.error) {
                    errorMessage = data.error
                } else if (response.statusText) {
                    errorMessage = response.statusText
                }
                
                console.error('Password update error:', { status: response.status, data, statusText: response.statusText })
                throw new Error(errorMessage)
            }
        } catch (error) {
            console.error('Error updating password:', error)
            console.log('About to show error toast:', error.message)
            toast.push(
                <Notification type="danger">
                    {error.message || 'Erro ao atualizar senha. Tente novamente.'}
                </Notification>,
                { placement: 'top-center' }
            )
            console.log('Error toast pushed')
        } finally {
            setIsSubmitting(false)
            setConfirmationOpen(false)
        }
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    // Show loading state while fetching user data
    if (loading) {
        return (
            <>
                <h4 className="mb-8">Segurança</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Carregando...</div>
                </div>
            </>
        )
    }

    // Show error if user not found
    if (!loading && !targetUser) {
        return (
            <>
                <h4 className="mb-8">Segurança</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-red-500">Usuário não encontrado</div>
                </div>
            </>
        )
    }

    // Show restricted message for non-admin users
    if (!isAdmin) {
        return (
            <>
                <h4 className="mb-8">Segurança</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Seção de segurança não disponível para edição de outros usuários</div>
                </div>
            </>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h4>Senha - {targetUser?.name}</h4>
                <p>
                    Lembre-se, a senha é a chave digital da conta.
                    Mantenha-a segura!
                </p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
                {isOwnPassword && (
                    <FormItem
                        label="Senha atual"
                        invalid={Boolean(errors.currentPassword)}
                        errorMessage={errors.currentPassword?.message}
                    >
                        <Controller
                            name="currentPassword"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="password"
                                    autoComplete="off"
                                    placeholder="•••••••••"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                )}
                <FormItem
                    label="Nova senha"
                    invalid={Boolean(errors.newPassword)}
                    errorMessage={errors.newPassword?.message}
                >
                    <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Confirmar nova senha"
                    invalid={Boolean(errors.confirmNewPassword)}
                    errorMessage={errors.confirmNewPassword?.message}
                >
                    <Controller
                        name="confirmNewPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="flex justify-end">
                    <Button variant="solid" type="submit">
                        Atualizar
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="Update password"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>Tem certeza que deseja alterar a senha de {targetUser?.name}?</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>Verificação em duas etapas</h4>
                <p>
                    A conta tem grande valor para hackers. Ative a verificação
                    em duas etapas para proteger a conta!
                </p>
                <div className="mt-8">
                    {authenticatorList.map((authOption, index) => (
                        <div
                            key={authOption.value}
                            className={classNames(
                                'py-6 border-gray-200 dark:border-gray-600',
                                !isLastChild(authenticatorList, index) &&
                                    'border-b',
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        size={35}
                                        className="bg-transparent"
                                        src={authOption.img}
                                    />
                                    <div>
                                        <h6>{authOption.label}</h6>
                                        <span>{authOption.desc}</span>
                                    </div>
                                </div>
                                <div>
                                    {selected2FaType === authOption.value ? (
                                        <Button
                                            size="sm"
                                            customColorClass={() =>
                                                'border-success ring-1 ring-success text-success hover:border-success hover:ring-success hover:text-success bg-transparent'
                                            }
                                            onClick={() =>
                                                setSelected2FaType('')
                                            }
                                        >
                                            Ativado
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setSelected2FaType(
                                                    authOption.value,
                                                )
                                            }
                                        >
                                            Ativar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default UserEditSecurity
