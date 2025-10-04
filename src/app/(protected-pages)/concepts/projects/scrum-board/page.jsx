import ScrumBoardProvider from './_components/ScrumBoardProvider'
import Board from './_components/Board'
import ScrumBoardAccessControl from './_components/ScrumBoardAccessControl'
import getScrumboardData from '@/server/actions/getScrumboardData'

export default async function Page() {
    const data = await getScrumboardData()

    return (
        <ScrumBoardAccessControl>
            <ScrumBoardProvider data={data}>
                <Board />
            </ScrumBoardProvider>
        </ScrumBoardAccessControl>
    )
}
