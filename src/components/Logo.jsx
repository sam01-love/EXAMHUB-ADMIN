import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'

export default function Logo({ to = '/admin' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <img src={logo} alt="EXAMHUB" className="h-9 w-9 rounded-lg object-cover" />
      <span className="font-heading text-lg font-extrabold tracking-tight">
        EXAMHUB
        <span className="ml-1.5 rounded-md bg-primary px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          Admin
        </span>
      </span>
    </Link>
  )
}
