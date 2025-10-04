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
import sleep from '@/utils/sleep'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import useUserStore from '@/stores/userStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const { Control } = components

const validationSchema = z.object({
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
    role: z.string().min(1, { message: 'Por favor, selecione uma função' }),
    status: z.string().min(1, { message: 'Por favor, selecione um status' }),
    title: z.string().min(1, { message: 'Cargo requerido' }),
})

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

const UserFormProfile = ({ userId }) => {
    const router = useRouter()
    const { users, updateUser, addUser } = useUserStore()

    // Get the specific user data if userId is provided
    const currentUser = useMemo(() => {
        if (userId && users.length > 0) {
            return users.find(user => user.id === userId)
        }
        return null
    }, [userId, users])

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
        formState: { errors, isSubmitting },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            email: currentUser?.email || '',
            dialCode: currentUser?.personalInfo?.dialCode || '+55',
            phoneNumber: currentUser?.personalInfo?.phoneNumber?.replace('+55-', '') || '',
            country: currentUser?.personalInfo?.country || 'BR',
            address: currentUser?.personalInfo?.address || '',
            postcode: currentUser?.personalInfo?.postcode || '',
            city: currentUser?.personalInfo?.city || '',
            title: currentUser?.title || '',
            img: currentUser?.img || '',
            role: currentUser?.role || 'user',
            status: currentUser?.status || 'active',
        }
    })

    // Reset form when currentUser changes (for editing mode)
    useEffect(() => {
        if (currentUser && userId) {
            console.log('Resetting form with current user data:', currentUser)
            reset({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                dialCode: currentUser.personalInfo?.dialCode || '+55',
                phoneNumber: currentUser.personalInfo?.phoneNumber?.replace('+55-', '') || '',
                country: currentUser.personalInfo?.country || 'BR',
                address: currentUser.personalInfo?.address || '',
                postcode: currentUser.personalInfo?.postcode || '',
                city: currentUser.personalInfo?.city || '',
                title: currentUser.title || '',
                img: currentUser.img || '',
                role: currentUser.role || 'user',
                status: currentUser.status || 'active',
            })
        }
    }, [currentUser, userId, reset])

    const onSubmit = async (values) => {
        try {
            console.log('Form submission started:', { userId, currentUser: !!currentUser, values })
            
            const userData = {
                firstName: values.firstName,
                lastName: values.lastName,
                name: `${values.firstName} ${values.lastName}`,
                email: values.email,
                img: values.img || '',
                role: values.role,
                status: values.status,
                title: values.title,
                personalInfo: {
                    location: `${values.city}, ${values.country}`,
                    address: values.address,
                    postcode: values.postcode,
                    city: values.city,
                    country: values.country,
                    dialCode: values.dialCode,
                    phoneNumber: `${values.dialCode}-${values.phoneNumber}`,
                    birthday: '',
                    facebook: '',
                    twitter: '',
                    pinterest: '',
                    linkedIn: '',
                }
            }

            console.log('User data prepared:', userData)

            if (userId && currentUser) {
                // Update existing user
                console.log('Updating existing user:', userId)
                const result = updateUser(userId, userData)
                console.log('Update result:', result)
                
                if (result && result.success) {
                    toast.push(
                        <Notification type="success">Usuário atualizado com sucesso!</Notification>,
                        { placement: 'top-center' }
                    )
                    await sleep(500)
                    router.push('/concepts/account/roles-permissions')
                } else {
                    toast.push(
                        <Notification type="danger">Erro ao atualizar usuário: {result?.error || 'Erro desconhecido'}</Notification>,
                        { placement: 'top-center' }
                    )
                }
            } else {
                // Create new user
                console.log('Creating new user')
                const result = addUser(userData)
                console.log('Create result:', result)
                
                if (result && result.success) {
                    toast.push(
                        <Notification type="success">Usuário criado com sucesso!</Notification>,
                        { placement: 'top-center' }
                    )
                    await sleep(500)
                    router.push('/concepts/account/roles-permissions')
                } else {
                    toast.push(
                        <Notification type="danger">Erro ao criar usuário: {result?.error || 'Erro desconhecido'}</Notification>,
                        { placement: 'top-center' }
                    )
                }
            }
        } catch (error) {
            console.error('Form submission error:', error)
            toast.push(
                <Notification type="danger">Erro ao {userId ? 'atualizar' : 'criar'} usuário: {error.message}</Notification>,
                { placement: 'top-center' }
            )
        }
    }

    return (
        <>
            <h4 className="mb-8">
                {userId ? 'Editar usuário' : 'Informações do usuário'}
            </h4>
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
                                                // Convert file to base64 data URL for persistence
                                                const file = files[0]
                                                const reader = new FileReader()
                                                reader.onload = (e) => {
                                                    field.onChange(e.target.result)
                                                }
                                                reader.readAsDataURL(file)
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
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        type="button"
                        onClick={() => router.push('/concepts/account/roles-permissions')}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        {userId ? 'Salvar' : 'Criar usuário'}
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default UserFormProfile
