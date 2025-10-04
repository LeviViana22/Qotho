import UserEdit from './_components/UserEdit'

const Page = async ({ params }) => {
    const { id } = await params
    return <UserEdit userId={id} />
}

export default Page
