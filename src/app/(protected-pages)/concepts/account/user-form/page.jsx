import UserForm from './_components/UserForm'

const Page = ({ searchParams }) => {
    return <UserForm userId={searchParams?.userId} />
}

export default Page

