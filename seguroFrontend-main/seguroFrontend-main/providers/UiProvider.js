"use client"
import { NextUIProvider } from '@nextui-org/react'
import React from 'react'

const UiProvider = ({children}) => {
  return (
    <NextUIProvider className=''>
        {children}
    </NextUIProvider>
  )
}

export default UiProvider