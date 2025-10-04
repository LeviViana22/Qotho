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

const validationSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, { message: 'Por favor, digite sua senha atual!' }),
        newPassword: z
            .string()
            .min(8, { message: 'A nova senha deve ter pelo menos 8 caracteres!' })
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
                message: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número!' 
            }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'Por favor, confirme sua nova senha!' }),
    })
    .refine((data) => data.confirmNewPassword === data.newPassword, {
        message: 'Senha não confere',
        path: ['confirmNewPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'A nova senha deve ser diferente da senha atual',
        path: ['newPassword'],
    })

const SettingsSecurity = () => {
    const { currentUser } = useUserStore()
    const [selected2FaType, setSelected2FaType] = useState(
        'googleAuthenticator',
    )
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formRef = useRef(null)

    const {
        getValues,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        console.log('SettingsSecurity component mounted')
        console.log('Current user:', currentUser)
        console.log('Current user ID:', currentUser?.id)
        console.log('Current user name:', currentUser?.name)
        console.log('Current user email:', currentUser?.email)
    }, [currentUser])

    const handlePostSubmit = async () => {
        console.log('handlePostSubmit called')
        if (!currentUser) {
            console.log('No current user found')
            toast.push(
                <Notification type="danger">Usuário não encontrado. Faça login novamente.</Notification>,
                { placement: 'top-center' }
            )
            setConfirmationOpen(false)
            return
        }

        console.log('Current user found:', currentUser.id)
        setIsSubmitting(true)
        
        try {
            const { currentPassword, newPassword } = getValues()
            
            // Call API to update password
            const response = await fetch(`/api/users/${currentUser.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                console.log('Password update successful, showing success toast')
                toast.push(
                    <Notification type="success">Senha atualizada com sucesso!</Notification>,
                    { placement: 'top-center' }
                )
                console.log('Success toast pushed')
                // Reset form
                reset()
            } else {
                // Show specific error message from API
                const errorMessage = data.error || 'Erro ao atualizar senha'
                console.error('Password update error:', data)
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

    const onSubmit = async (data) => {
        console.log('Form submitted with data:', data)
        console.log('Form validation passed, opening confirmation dialog')
        setConfirmationOpen(true)
    }

    return (
        <div>
            <div className="mb-8">
                <h4>Senha</h4>
                <p>
                    Lembre-se, sua senha é a chave digital da sua conta.
                    Mantenha-a segura!
                </p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
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
                    <div className="text-xs text-gray-500 mt-1">
                        A senha deve ter pelo menos 8 caracteres, incluindo uma letra minúscula, uma maiúscula e um número.
                    </div>
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
                <p>Tem certeza que deseja alterar sua senha?</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>Verificação em duas etapas</h4>
                <p>
                    Sua conta tem grande valor para hackers. Ative a verificação
                    em duas etapas para proteger sua conta!
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

export default SettingsSecurity
