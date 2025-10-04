import Container from '@/components/shared/Container'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'

const Page = () => {
    return (
        <Container className="h-full">
            <div className="h-full flex flex-col items-center justify-center">
                <SpaceSignBoard height={280} width={280} />
                <div className="mt-10 text-center">
                    <h3 className="mb-2">Acesso Negado</h3>
                    <p className="text-base">
                        Você não tem permissão para acessar esta página.
                    </p>
                </div>
            </div>
        </Container>
    )
}

export default Page
