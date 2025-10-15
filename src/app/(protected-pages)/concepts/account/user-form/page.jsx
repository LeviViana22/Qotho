import UserForm from './_components/UserForm'
import { requireAdmin } from '@/utils/serverPageAccess'

const Page = async ({ searchParams }) => {
    // Require admin access to access user forms
    await requireAdmin()
    
    const params = await searchParams
    return <UserForm userId={params?.userId} />
}

export default Page

