'use client'
import { useAuth } from '../auth.context'
import BigCalendar from '../components/BigCalendar'


export default function Planning() {
  const { user, activeTenant } = useAuth();

    return(
        <main className='p-8'>
            <h1>Gestion de l&apos;emploi du temps</h1>
            <BigCalendar />
        </main>
        )
}