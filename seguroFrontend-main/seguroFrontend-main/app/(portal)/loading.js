'use client'
import { Skeleton } from '@nextui-org/react'
import React from 'react'

const loading = () => {
    return (
        <div className=''>
            <div className='px-4 pt-10 sm:ml-28'>
                
                <Skeleton className="w-1/5 h-10 rounded-lg">
                    </Skeleton>
                <Skeleton className="mt-10 w-full h-60 rounded-lg">
                    </Skeleton>

            </div>
        </div>

    )
}

export default loading