import RegistroCivilProvider from './_components/RegistroCivilProvider'
import Board from './_components/Board'
import RegistroCivilAccessControl from './_components/RegistroCivilAccessControl'
import getRegistroCivilData from '@/server/actions/getRegistroCivilData'

export default async function Page() {
    const data = await getRegistroCivilData()

    return (
        <RegistroCivilAccessControl>
            <RegistroCivilProvider data={data}>
                <Board />
            </RegistroCivilProvider>
        </RegistroCivilAccessControl>
    )
}

