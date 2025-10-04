import CalendarProvider from './_components/CalendarProvider'
import Calendar from './_components/Calendar'

export default function Page() {
    return (
        <CalendarProvider>
            <Calendar />
        </CalendarProvider>
    )
}
