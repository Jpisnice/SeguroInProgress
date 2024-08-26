'use client'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

const page = () => {
    const router = useRouter()
    useEffect(() => {
        Cookies.remove('userId')
        Cookies.remove('userName')
        Cookies.remove('userType')
        router.push('/')
    }, [])
    return (
        <div className='w-screen h-screen flex justify-center items-center'>
            <div className='text-gray-600'>Logging out ...</div>
        </div>
    )
}

export default page