import AdminNavbar from '@/components/AdminNavbar'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

const layout = ({ children }) => {
  return (
    <div >
      <AdminNavbar/>
      {children}
    </div>
  )
}

export default layout