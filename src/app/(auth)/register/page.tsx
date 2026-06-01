import { redirect } from 'next/navigation'

// /register now lives at /signup — keep old URL working
export default function RegisterRedirect() {
  redirect('/signup')
}
