'use client'

import { lazy, Suspense } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import UserEditMenu from './UserEditMenu'
import UserEditMobileMenu from './UserEditMobileMenu'
import Loading from '@/components/shared/Loading'
import { useUserEditStore } from '../_store/userEditStore'

const Profile = lazy(() => import('./UserEditProfile'))
const Security = lazy(() => import('./UserEditSecurity'))
const Notification = lazy(() => import('./UserEditNotification'))

const UserEdit = ({ userId }) => {
    const { currentView } = useUserEditStore()

    return (
        <AdaptiveCard className="h-full">
            <div className="flex flex-auto h-full">
                <div className="w-[200px] xl:w-[280px] hidden lg:block">
                    <UserEditMenu />
                </div>
                <div className="xl:ltr:pl-6 xl:rtl:pr-6 flex-1 py-2">
                    <div className="mb-6 lg:hidden">
                        <UserEditMobileMenu />
                    </div>
                    <Suspense
                        fallback={<Loading loading={true} className="w-full" />}
                    >
                        {currentView === 'profile' && <Profile userId={userId} />}
                        {currentView === 'security' && <Security userId={userId} />}
                        {currentView === 'notification' && <Notification userId={userId} />}
                    </Suspense>
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default UserEdit
