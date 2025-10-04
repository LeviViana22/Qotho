'use client'

import { lazy, Suspense } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import UserFormMenu from './UserFormMenu'
import UserFormMobileMenu from './UserFormMobileMenu'
import Loading from '@/components/shared/Loading'
import { useUserFormStore } from '../_store/userFormStore'

const Profile = lazy(() => import('./UserFormProfile'))
const Security = lazy(() => import('./UserFormSecurity'))
const Notification = lazy(() => import('./UserFormNotification'))
const Billing = lazy(() => import('./UserFormBilling'))
const Integration = lazy(() => import('./UserFormIntegration'))

const UserForm = ({ userId }) => {
    const { currentView } = useUserFormStore()

    return (
        <AdaptiveCard className="h-full">
            <div className="flex flex-auto h-full">
                <div className="w-[200px] xl:w-[280px] hidden lg:block">
                    <UserFormMenu />
                </div>
                <div className="xl:ltr:pl-6 xl:rtl:pr-6 flex-1 py-2">
                    <div className="mb-6 lg:hidden">
                        <UserFormMobileMenu />
                    </div>
                    <Suspense
                        fallback={<Loading loading={true} className="w-full" />}
                    >
                        {currentView === 'profile' && <Profile userId={userId} />}
                        {currentView === 'security' && <Security />}
                        {currentView === 'notification' && <Notification />}
                        {currentView === 'billing' && <Billing />}
                        {currentView === 'integration' && <Integration />}
                    </Suspense>
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default UserForm

