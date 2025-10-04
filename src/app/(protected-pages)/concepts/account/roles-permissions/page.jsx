import Container from '@/components/shared/Container'
import RolesPermissionsGroups from './_components/RolesPermissionsGroups'
import RolesPermissionsGroupsAction from './_components/RolesPermissionsGroupsAction'
import RolesPermissionsUserAction from './_components/RolesPermissionsUserAction'
import RolesPermissionsUserTable from './_components/RolesPermissionsUserTable'
import RolesPermissionsUserSelected from './_components/RolesPermissionsUserSelected'
import RolesPermissionsAccessDialog from './_components/RolesPermissionsAccessDialog'
import RolesPermissionsProvider from './_components/RolesPermissionsProvider'
import getRolesPermissionsRoles from '@/server/actions/getRolesPermissionsRoles'
import { getAllUsers } from '@/lib/user'
import { requireAdmin } from '@/utils/serverPageAccess'

export default async function Page({ searchParams }) {
    // Require admin access using the new utility
    const session = await requireAdmin()
    
    const params = await searchParams

    const roleList = await getRolesPermissionsRoles()
    
    // Get users from database
    const users = await getAllUsers()
    
    // Map image field to img for frontend compatibility
    const mappedUsers = users.map(user => {
        const { password, ...safeUser } = user
        return {
            ...safeUser,
            img: safeUser.image || '', // Map image to img for frontend
        }
    })
    
    const userList = {
        list: mappedUsers,
        total: mappedUsers.length
    }

    return (
        <RolesPermissionsProvider
            roleList={roleList}
            userList={userList.list}
            role={params.role}
            status={params.status}
        >
            <Container>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3>Funções e permissões</h3>
                        <RolesPermissionsGroupsAction />
                    </div>
                    <div className="mb-10">
                        <RolesPermissionsGroups />
                    </div>
                </div>
                <div>
                    <div>
                        <div className="mb-6 flex flex-col gap-5">
                            <h3>Todos os usuários</h3>
                            <div className="flex-1">
                                <RolesPermissionsUserAction />
                            </div>
                        </div>
                        <RolesPermissionsUserTable
                            userListTotal={userList.total}
                            pageIndex={parseInt(params.pageIndex) || 1}
                            pageSize={parseInt(params.pageSize) || 10}
                        />
                    </div>
                </div>
            </Container>
            <RolesPermissionsAccessDialog />
            <RolesPermissionsUserSelected />
        </RolesPermissionsProvider>
    )
}
