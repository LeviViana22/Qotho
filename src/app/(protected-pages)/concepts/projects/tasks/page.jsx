import TasksProvider from './_components/TasksProvider'
import TasksHeader from './_components/TasksHeader'
import TaskList from './_components/TaskList'
import TaskDialog from './_components/TaskDialog'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import getScrumboardData from '@/server/actions/getScrumboardData'
import getSrcumboardMembers from '@/server/actions/getSrcumboardMembers'
import TasksPageWrapper from './_components/TasksPageWrapper'

export default async function Page() {
    const data = await getScrumboardData()
    const projectMembers = await getSrcumboardMembers()

    return (
        <TasksProvider data={data} projectMembers={projectMembers}>
            <TasksPageWrapper />
        </TasksProvider>
    )
}
