'use client'
import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import { apiGetSettingsNotification } from '@/services/AccontsService'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import { TbMessageCircleCheck } from 'react-icons/tb'
import useUserStore from '@/stores/userStore'

const emailNotificationOption = [
    {
        label: 'Notícias & atualizações',
        value: 'newsAndUpdate',
        desc: 'Novidades sobre o produto e atualizações de funcionalidades',
    },
    {
        label: 'Dicas & tutoriais',
        value: 'tipsAndTutorial',
        desc: 'Dicas & truques para aumentar a eficiência do seu desempenho',
    },
    {
        label: 'Ofertas & promoções',
        value: 'offerAndPromotion',
        desc: 'Promoções sobre o preço do produto e descontos mais recentes',
    },
    {
        label: 'Acompanhamento de lembretes',
        value: 'followUpReminder',
        desc: 'Receba notificações de todos os lembretes que foram feitos',
    },
]

const notifyMeOption = [
    {
        label: 'Todas as novas mensagens',
        value: 'allNewMessage',
        desc: 'Notificações de broadcast para o canal para cada nova mensagem',
    },
    {
        label: 'Menções apenas',
        value: 'mentionsOnly',
        desc: 'Apenas me avise no canal se alguém me mencionar em uma mensagem',
    },
    {
        label: 'Sem notificações',
        value: 'nothing',
        desc: `Não me notifique nada`,
    },
]

const UserEditNotification = ({ userId }) => {
    const { currentUser, getUserById } = useUserStore()
    const targetUser = getUserById(userId)
    const isAdmin = currentUser?.role === 'admin'
    
    const {
        data = {
            email: [],
            desktop: false,
            unreadMessageBadge: false,
            notifymeAbout: '',
        },
        mutate,
    } = useSWR(
        isAdmin ? `/api/settings/notification/${userId}` : null,
        () => apiGetSettingsNotification(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const handleEmailNotificationOptionChange = (values) => {
        const newData = cloneDeep(data)
        newData.email = values
        mutate(newData, false)
    }

    const handleEmailNotificationOptionCheckAll = (value) => {
        const newData = cloneDeep(data)
        if (value) {
            newData.email = [
                'newsAndUpdate',
                'tipsAndTutorial',
                'offerAndPromotion',
                'followUpReminder',
            ]
        } else {
            newData.email = []
        }

        mutate(newData, false)
    }

    const handleDesktopNotificationCheck = (value) => {
        const newData = cloneDeep(data)
        newData.desktop = value
        mutate(newData, false)
    }

    const handleUnreadMessagebadgeCheck = (value) => {
        const newData = cloneDeep(data)
        newData.unreadMessageBadge = value
        mutate(newData, false)
    }

    const handleNotifyMeChange = (value) => {
        const newData = cloneDeep(data)
        newData.notifymeAbout = value
        mutate(newData, false)
    }

    // Show restricted message for non-admin users
    if (!isAdmin) {
        return (
            <>
                <h4 className="mb-8">Notificações</h4>
                <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Seção de notificações não disponível para edição de outros usuários</div>
                </div>
            </>
        )
    }

    return (
        <div>
            <h4>Notificações - {targetUser?.name}</h4>
            <div className="mt-2">
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>Ativar notificação de desktop</h5>
                        <p>
                            Decide se você quer ser notificado de novas mensagens e atualizações
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.desktop}
                            onChange={handleDesktopNotificationCheck}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>Ativar notificação de mensagens não lidas</h5>
                        <p>
                            Exibe um indicador vermelho no ícone de notificação quando você tiver mensagens não lidas
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.unreadMessageBadge}
                            onChange={handleUnreadMessagebadgeCheck}
                        />
                    </div>
                </div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-600">
                    <h5>Ativar notificação de mensagens não lidas</h5>
                    <div className="mt-4">
                        <Radio.Group
                            vertical
                            className="flex flex-col gap-6"
                            value={data.notifymeAbout}
                            onChange={handleNotifyMeChange}
                        >
                            {notifyMeOption.map((option) => (
                                <div key={option.value} className="flex gap-4">
                                    <div className="mt-1.5">
                                        <Radio value={option.value} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="mt-1">
                                            <TbMessageCircleCheck className="text-lg" />
                                        </div>
                                        <div>
                                            <h6>{option.label}</h6>
                                            <p>{option.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Radio.Group>
                    </div>
                </div>
                <div className="flex items-center justify-between py-6">
                    <div>
                        <h5>Notificação por email</h5>
                        <p>
                            Velin pode enviar notificações por email para qualquer nova mensagem direta
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.email.length > 0}
                            onChange={handleEmailNotificationOptionCheckAll}
                        />
                    </div>
                </div>
                <Checkbox.Group
                    vertical
                    className="flex flex-col gap-6"
                    value={data.email}
                    onChange={handleEmailNotificationOptionChange}
                >
                    {emailNotificationOption.map((option) => (
                        <div key={option.value} className="flex gap-4">
                            <div className="mt-1.5">
                                <Checkbox value={option.value} />
                            </div>
                            <div>
                                <h6>{option.label}</h6>
                                <p>{option.desc}</p>
                            </div>
                        </div>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    )
}

export default UserEditNotification
