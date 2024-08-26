import VendorNavbar from '@/components/VendorNavbar'
import React from 'react'

const vendorLayout = ({children}) => {
  return (
    <div>
    <VendorNavbar/>
    {children}
    </div>
  )
}

export default vendorLayout