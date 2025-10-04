'use client'
import { useMemo, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import { countryList } from '@/constants/countries.constant'
import { components } from 'react-select'
import useUserStore from '@/stores/userStore'
import { useUserStoreHydrated } from '@/hooks/useUserStoreHydrated'
import isBrowser from '@/utils/isBrowser'
import { fileToCompressedDataURL } from '@/utils/imageStorage'
import sleep from '@/utils/sleep'
import { useRouter } from 'next/navigation'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'

const { Control } = components

// Create validation schema for editing other users
const createValidationSchema = (isAdmin) => {
    const baseSchema = {
        firstName: z.string().min(1, { message: 'Nome requerido' }),
        lastName: z.string().min(1, { message: 'Sobrenome requerido' }),
        email: z
            .string()
            .min(1, { message: 'Email requerido' })
            .email({ message: 'Email inválido' }),
        dialCode: z.string().min(1, { message: 'Por favor, selecione o código do país' }),
        phoneNumber: z
            .string()
            .min(1, { message: 'Por favor, digite seu número de telefone' }),
        country: z.string().min(1, { message: 'Por favor, selecione um país' }),
        address: z.string().min(1, { message: 'Endereço requerido' }),
        postcode: z.string().min(1, { message: 'CEP requerido' }),
        city: z.string().min(1, { message: 'Cidade requerida' }),
        img: z.string(),
    }

    // Add admin-only fields if user is admin
    if (isAdmin) {
        baseSchema.role = z.string().min(1, { message: 'Por favor, selecione uma função' })
        baseSchema.status = z.string().min(1, { message: 'Por favor, selecione um status' })
        baseSchema.title = z.string().min(1, { message: 'Cargo requerido' })
    }

    return z.object(baseSchema)
}

const roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Usuário', value: 'user' },
    { label: 'Suporte', value: 'support' },
    { label: 'Auditor', value: 'auditor' },
    { label: 'Convidado', value: 'guest' },
]

const statusOptions = [
    { label: 'Ativo', value: 'active' },
    { label: 'Bloqueado', value: 'blocked' },
]

const CustomSelectOption = (props) => {
    return (
        <DefaultOption
            {...props}
            customLabel={(data, label) => (
                <span className="flex items-center gap-2">
                    <Avatar
                        shape="circle"
                        size={20}
                        src={`/img/countries/${data.value}.png`}
                    />
                    {props.variant === 'country' && <span>{label}</span>}
                    {props.variant === 'phone' && <span>{data.dialCode}</span>}
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar
                    className="ltr:ml-4 rtl:mr-4"
                    shape="circle"
                    size={20}
                    src={`/img/countries/${selected.value}.png`}
                />
            )}
            {children}
        </Control>
    )
}

const UserEditProfile = ({ userId }) => {
    const { currentUser, updateUser, updateUserImage, removeUserImage, cleanupOldImages } = useUserStore()
    const isHydrated = useUserStoreHydrated()
    const router = useRouter()
    const [targetUser, setTargetUser] = useState(null)
    const [loading, setLoading] = useState(true)
    
    // Check if current user is admin
    const isAdmin = currentUser?.role === 'admin'

    // Fetch user data from API
    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return
            
            try {
                setLoading(true)
                const response = await fetch(`/api/users/${userId}`)
                if (response.ok) {
                    const data = await response.json()
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

        if (isHydrated && userId) {
            fetchUser()
        }
    }, [isHydrated, userId])
    
    // Create dynamic validation schema
    const validationSchema = useMemo(() => createValidationSchema(isAdmin), [isAdmin])

    const dialCodeList = useMemo(() => {
        const newCountryList = JSON.parse(JSON.stringify(countryList))

        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    const beforeUpload = (files) => {
        let valid = true

        const allowedFileType = ['image/jpeg', 'image/png']
        if (files) {
            const fileArray = Array.from(files)
            for (const file of fileArray) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Por favor, envie um arquivo .jpeg ou .png!'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    // Convert target user to form data format
    const formData = useMemo(() => {
        if (!isHydrated || !targetUser) return {}
        
        const baseData = {
            firstName: targetUser.firstName || '',
            lastName: targetUser.lastName || '',
            email: targetUser.email || '',
            dialCode: targetUser.personalInfo?.dialCode || '+55',
            phoneNumber: targetUser.personalInfo?.phoneNumber?.replace('+55-', '') || '',
            country: targetUser.personalInfo?.country || 'BR',
            address: targetUser.personalInfo?.address || '',
            postcode: targetUser.personalInfo?.postcode || '',
            city: targetUser.personalInfo?.city || '',
            img: targetUser.img || '', // Don't load stored image here to prevent hydration mismatch
        }

        // Add admin fields if user is admin
        if (isAdmin) {
            baseData.role = targetUser.role || 'admin'
            baseData.status = targetUser.status || 'active'
            baseData.title = targetUser.title || ''
        }

        return baseData
    }, [targetUser, isHydrated, isAdmin])

    useEffect(() => {
        if (isHydrated && formData) {
            reset(formData)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, isHydrated])

    // Load stored image after hydration to prevent hydration mismatch
    useEffect(() => {
        if (isHydrated && targetUser && isBrowser) {
            if (targetUser.img) {
                setValue('img', targetUser.img)
            }
        }
    }, [isHydrated, targetUser, setValue])

    const onSubmit = async (values) => {
        try {
            await sleep(500)
            
            // Handle image storage
            let imageToStore = values.img
            
            // If there's a new blob image, convert and store it
            if (imageToStore && imageToStore.startsWith('blob:')) {
                try {
                    const response = await fetch(imageToStore)
                    const blob = await response.blob()
                    const compressedDataURL = await fileToCompressedDataURL(blob)
                    // Clean up old localStorage images
                    cleanupOldImages()
                    // Update image in user store
                    updateUserImage(targetUser.id, compressedDataURL)
                    imageToStore = compressedDataURL
                } catch (error) {
                    console.error('Error processing image:', error)
                    // Keep the existing image if processing fails
                    imageToStore = targetUser.img || ''
                }
            } else if (!imageToStore) {
                // If no image provided, keep the existing one
                imageToStore = targetUser.img || ''
            }
            
            // Update user data in Zustand store
            const updatedUserData = {
                firstName: values.firstName,
                lastName: values.lastName,
                name: `${values.firstName} ${values.lastName}`,
                email: values.email,
                img: imageToStore,
                personalInfo: {
                    ...(targetUser?.personalInfo || {}),
                    dialCode: values.dialCode,
                    phoneNumber: `${values.dialCode}-${values.phoneNumber}`,
                    country: values.country,
                    address: values.address,
                    postcode: values.postcode,
                    city: values.city,
                    location: `${values.city}, ${values.country}`,
                }
            }

            // Add admin fields if user is admin
            if (isAdmin) {
                updatedUserData.role = values.role
                updatedUserData.status = values.status
                updatedUserData.title = values.title
            }

            // Update the user
            const result = await updateUser(targetUser.id, updatedUserData)
            if (result.success) {
                toast.push(
                    <Notification type="success">Usuário atualizado com sucesso!</Notification>,
                    { placement: 'top-center' }
                )
                // Navigate back to users page after a short delay
                setTimeout(() => {
                    router.push('/concepts/account/roles-permissions')
                }, 1000)
            } else {
                toast.push(
                    <Notification type="danger">Erro ao atualizar usuário: {result.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Error updating user:', error)
            toast.push(
                <Notification type="danger">Erro ao atualizar usuário. Tente novamente.</Notification>,
                { placement: 'top-center' }
            )
        }
    }

    // Show loading state while hydrating or fetching user data
    if (!isHydrated || loading) {
        return (
            <>
                <h4 className="mb-8">Informações pessoais</h4>
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
                <h4 className="mb-8">Informações pessoais</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-red-500">Usuário não encontrado</div>
                </div>
            </>
        )
    }

    return (
        <>
            <h4 className="mb-8">Informações pessoais</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                    <Controller
                        name="img"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-4">
                                <Avatar
                                    size={90}
                                    className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                                    icon={<HiOutlineUser />}
                                    src={field.value}
                                />
                                <div className="flex items-center gap-2">
                                    <Upload
                                        showList={false}
                                        uploadLimit={1}
                                        beforeUpload={beforeUpload}
                                        onChange={async (files) => {
                                            if (files.length > 0) {
                                                const file = files[0]
                                                const compressedDataURL = await fileToCompressedDataURL(file)

                                                if (compressedDataURL) {
                                                    // Clean up old localStorage images
                                                    cleanupOldImages()
                                                    // Update image in user store
                                                    updateUserImage(targetUser.id, compressedDataURL)
                                                    field.onChange(compressedDataURL)
                                                } else {
                                                    console.error('Failed to compress image')
                                                    field.onChange(URL.createObjectURL(file))
                                                }
                                            }
                                        }}
                                    >
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            type="button"
                                            icon={<TbPlus />}
                                        >
                                            Adicionar imagem
                                        </Button>
                                    </Upload>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                            removeUserImage(targetUser.id)
                                            field.onChange('')
                                        }}
                                    >
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        )}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormItem
                        label="Nome"
                        invalid={Boolean(errors.firstName)}
                        errorMessage={errors.firstName?.message}
                    >
                        <Controller
                            name="firstName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Nome"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Sobrenome"
                        invalid={Boolean(errors.lastName)}
                        errorMessage={errors.lastName?.message}
                    >
                        <Controller
                            name="lastName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Sobrenome"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <FormItem
                    label="Email"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                autoComplete="off"
                                placeholder="Email"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {isAdmin && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormItem
                            label="Função"
                            invalid={Boolean(errors.role)}
                            errorMessage={errors.role?.message}
                        >
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        instanceId="role"
                                        options={roleOptions}
                                        {...field}
                                        placeholder="Selecione uma função"
                                        onChange={(option) => field.onChange(option?.value)}
                                        value={roleOptions.find(opt => opt.value === field.value)}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Status"
                            invalid={Boolean(errors.status)}
                            errorMessage={errors.status?.message}
                        >
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        instanceId="status"
                                        options={statusOptions}
                                        {...field}
                                        placeholder="Selecione um status"
                                        onChange={(option) => field.onChange(option?.value)}
                                        value={statusOptions.find(opt => opt.value === field.value)}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                )}

                {isAdmin && (
                    <FormItem
                        label="Cargo"
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
                                    placeholder="Cargo"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                )}

                <div className="flex items-end gap-4 w-full mb-6">
                    <FormItem
                        invalid={
                            Boolean(errors.phoneNumber) ||
                            Boolean(errors.dialCode)
                        }
                    >
                        <label className="form-label mb-2">Telefone</label>
                        <Controller
                            name="dialCode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    instanceId="dial-code"
                                    options={dialCodeList}
                                    {...field}
                                    className="w-[150px]"
                                    components={{
                                        Option: (props) => (
                                            <CustomSelectOption
                                                variant="phone"
                                                {...props}
                                            />
                                        ),
                                        Control: CustomControl,
                                    }}
                                    placeholder=""
                                    value={dialCodeList.filter(
                                        (option) =>
                                            option.dialCode === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.dialCode)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        className="w-full"
                        invalid={
                            Boolean(errors.phoneNumber) ||
                            Boolean(errors.dialCode)
                        }
                        errorMessage={errors.phoneNumber?.message}
                    >
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                                <NumericInput
                                    autoComplete="off"
                                    placeholder="Telefone"
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <h4 className="mb-6">Endereço</h4>
                <FormItem
                    label="País"
                    invalid={Boolean(errors.country)}
                    errorMessage={errors.country?.message}
                >
                    <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                            <Select
                                instanceId="country"
                                options={countryList}
                                {...field}
                                components={{
                                    Option: (props) => (
                                        <CustomSelectOption
                                            variant="country"
                                            {...props}
                                        />
                                    ),
                                    Control: CustomControl,
                                }}
                                placeholder=""
                                value={countryList.filter(
                                    (option) => option.value === field.value,
                                )}
                                onChange={(option) =>
                                    field.onChange(option?.value)
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Endereço"
                    invalid={Boolean(errors.address)}
                    errorMessage={errors.address?.message}
                >
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Endereço"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        label="Cidade"
                        invalid={Boolean(errors.city)}
                        errorMessage={errors.city?.message}
                    >
                        <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Cidade"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="CEP"
                        invalid={Boolean(errors.postcode)}
                        errorMessage={errors.postcode?.message}
                    >
                        <Controller
                            name="postcode"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="CEP"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        Salvar usuário
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default UserEditProfile
