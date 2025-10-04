'use client'
import { useMemo, useEffect } from 'react'
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
import { useUserFormStore } from '../_store/userFormStore'
import isBrowser from '@/utils/isBrowser'
import { fileToCompressedDataURL, storeImage, removeStoredImage } from '@/utils/imageStorage'
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

// Create validation schema for new user creation
const createValidationSchema = (isAdmin) => {
    const baseSchema = {
        firstName: z.string().min(1, { message: 'Nome requerido' }),
        lastName: z.string().min(1, { message: 'Sobrenome requerido' }),
        email: z
            .string()
            .min(1, { message: 'Email requerido' })
            .email({ message: 'Email inválido' }),
        password: z
            .string()
            .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
                message: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
            }),
        confirmPassword: z.string().min(1, { message: 'Confirme a senha' }),
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

    return z.object(baseSchema).refine((data) => data.password === data.confirmPassword, {
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
    })
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

const AddUserProfile = () => {
    const { currentUser, addUser } = useUserStore()
    const { getFormData } = useUserFormStore()
    const isHydrated = useUserStoreHydrated()
    const router = useRouter()
    
    // Check if current user is admin
    const isAdmin = currentUser?.role === 'admin'
    
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

    // Initialize form with empty data for new user
    const formData = useMemo(() => {
        if (!isHydrated) return {}
        
        const baseData = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            dialCode: '+55',
            phoneNumber: '',
            country: 'BR',
            address: '',
            postcode: '',
            city: '',
            img: '',
        }

        // Add admin fields for new user creation
        if (isAdmin) {
            baseData.role = 'user' // Default role for new users
            baseData.status = 'active' // Default status
            baseData.title = ''
        }

        return baseData
    }, [isHydrated, isAdmin])

    useEffect(() => {
        if (isHydrated && formData) {
            reset(formData)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, isHydrated])

    const onSubmit = async (values) => {
        try {
            await sleep(500)
            
            // Handle image storage if there's a new image
            let imageToStore = values.img
            if (imageToStore && imageToStore.startsWith('blob:')) {
                try {
                    const response = await fetch(imageToStore)
                    const blob = await response.blob()
                    const compressedDataURL = await fileToCompressedDataURL(blob)
                    // Generate a temporary ID for the new user
                    const tempId = `temp_${Math.floor(123456)}`
                    storeImage(tempId, compressedDataURL)
                    imageToStore = compressedDataURL
                } catch (error) {
                    console.error('Error processing image:', error)
                    imageToStore = ''
                }
            }
            
            // Get password from security form store
            const formData = getFormData()
            const securityData = formData.security || {}
            const password = securityData.password
            
            if (!password) {
                toast.push(
                    <Notification type="danger">Por favor, defina uma senha na aba Segurança primeiro.</Notification>,
                    { placement: 'top-center' }
                )
                return
            }
            
            // Create new user data
            const newUserData = {
                firstName: values.firstName,
                lastName: values.lastName,
                name: `${values.firstName} ${values.lastName}`,
                email: values.email,
                password: password, // Password from security form store
                img: imageToStore,
                personalInfo: {
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
                newUserData.role = values.role
                newUserData.status = values.status
                newUserData.title = values.title
            }

            // Create new user
            const result = await addUser(newUserData)
            if (result.success) {
                toast.push(
                    <Notification type="success">Usuário criado com sucesso!</Notification>,
                    { placement: 'top-center' }
                )
                // Navigate back to users page after a short delay
                setTimeout(() => {
                    router.push('/concepts/account/roles-permissions')
                }, 1000)
            } else {
                toast.push(
                    <Notification type="danger">Erro ao criar usuário: {result.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Error creating user:', error)
            toast.push(
                <Notification type="danger">Erro ao criar usuário. Tente novamente.</Notification>,
                { placement: 'top-center' }
            )
        }
    }

    // Show loading state while hydrating (only in browser)
    if (isBrowser && !isHydrated) {
        return (
            <>
                <h4 className="mb-8">Informações pessoais</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Carregando...</div>
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
                                                    const tempId = `temp_${Math.floor(123456)}`
                                                    const success = storeImage(tempId, compressedDataURL)
                                                    if (success) {
                                                        field.onChange(compressedDataURL)
                                                    } else {
                                                        console.warn('Could not store image, using temporary URL')
                                                        field.onChange(URL.createObjectURL(file))
                                                    }
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

                <div className="grid md:grid-cols-2 gap-4">
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
                </div>

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
                        Criar usuário
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default AddUserProfile

