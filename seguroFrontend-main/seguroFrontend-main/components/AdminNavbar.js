'use client'
import IconBxMenuAltLeft from '@/assets/js/IconBxMenuAltLeft'
import IconDashboard from '@/assets/js/IconDashboard'
import IconDocumentTextOutline from '@/assets/js/IconDocumentTextOutline'
import IconGear from '@/assets/js/IconGear'
import IconHandshake from '@/assets/js/IconHandshake'
import IconLogout from '@/assets/js/IconLogout'
import IconMoneyBillStack from '@/assets/js/IconMoneyBillStack'
import Logo from '@/assets/images/logo.svg'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

const AdminNavbar = ({ active = '' }) => {
    const pathname = usePathname()

    const [showNav, setShowNav] = useState(false)

    const navMenu = [{
        name: 'Dashboard',
        slug: 'adminDashboard',
        icon: <IconDashboard />,
    },
    {
        name: 'Vendors',
        slug: 'adminVendors',
        icon: <IconHandshake />,
    },
    {
        name: 'Subscription Plan',
        slug: 'adminSubscriptionPlan',
        icon: <IconMoneyBillStack />,
    },
    {
        name: 'Reports',
        slug: 'adminReports',
        icon: <IconDocumentTextOutline />,
    },
    {
        name: 'Settings',
        slug: 'adminSettings',
        icon: <IconGear />,
    },
    {
        name: 'Logout',
        slug: 'logout',
        icon: <IconLogout />,
    },
    ]
    if (typeof window !== "undefined") {
        document.addEventListener('mousedown', ()=> setShowNav(false))
    }

    return (
        <>
            <button onClick={()=> setShowNav(true)} data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" className="inline-flex items-center p-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <span className="sr-only">Open sidebar</span>
                <div className='text-4xl text-orange-600'>
                    <IconBxMenuAltLeft />
                </div>

            </button>

            <aside id="default-sidebar" className={showNav ?
                "fixed top-0 left-0 z-40 w-20 sm:w-28 h-screen transition-transform -translate-x-0 sm:translate-x-0" :
                "fixed top-0 left-0 z-40 w-20 sm:w-28 h-screen transition-transform -translate-x-full sm:translate-x-0"
            } aria-label="Sidebar">
                <div className="h-full pl-3 py-4 overflow-y-auto bg-white ">
                    <ul className="space-y-2 font-medium text-center">
                        <li>
                            <div className=" h-24 flex flex-col items-center gap-1 p-2 text-gray-900 rounded-s-xl  group">
                            <Image src={Logo} alt="Logo" className='lg:h-20 lg:w-20 md:h-20 md:w-20 w-14 h-14 z-10 py-auto' />
                            </div>
                        </li>
                        {navMenu.map((data, index) => <li className='relative' key={index}>
                            {pathname.split('/')[1] == data.slug && <><div className="absolute top-0 right-0 w-5 h-5 transform -translate-y-full bg-neutral-100"></div>
                                <div className="absolute top-0 right-0 w-10 h-10 transform -translate-y-full bg-white rounded-3xl"></div></>}
                            {data.slug != 'logout' ? <Link href={data.slug} 
                            onClick={()=> setShowNav(false)}
                            className={
                                pathname.split('/')[1] == data.slug ? 
                                " h-15 sm:h-20 bg-zinc-100 shadow-[rgba(229, 229, 229, 0.5)_-10px_5px_4px_0px] flex flex-col items-center justify-between gap-1 p-2 text-gray-900 rounded-s-xl hover:bg-gray-100  group" : 
                                " h-15 sm:h-20 flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-gray-900 rounded-lg  group relative z-10"
                            }>
                                <div className='text-4xl'>
                                    {data.icon}
                                </div>
                                <span className="hidden sm:block flex-1 items-center text-center text-xs font-bold">{data.name}</span>
                            </Link> : <Link type='button' href={data.slug} className='font-bold bg-orange-600 hover:bg-orange-700 rounded-full text-2xl text-center gap-1 p-3 pl-4 text-white'>{data.icon}</Link>}
                            {pathname.split('/')[1] == data.slug && <><div className="absolute bottom-0 right-0 w-5 h-5 transform translate-y-full bg-neutral-100"></div>
                                <div className="absolute bottom-0 right-0 w-10 h-10 transform translate-y-full bg-white rounded-3xl shadow-neutral-200 shadow-inherit"></div></>}
                        </li>)}

                    </ul>
                </div>
            </aside>
        </>)
}

export default AdminNavbar