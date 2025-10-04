import DashboardWrapper from './_components/DashboardWrapper'
import getProjectDashboard from '@/server/actions/getProjectDashboard'

export default async function Page() {
    const data = await getProjectDashboard()

    return <DashboardWrapper data={data} />
}
