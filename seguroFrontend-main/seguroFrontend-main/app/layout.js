import UiProvider from '@/providers/UiProvider'
import NextTopLoader from 'nextjs-toploader';
import './globals.css'
import { Inter } from 'next/font/google'
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Seguro',
  description: 'Access Control',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className='bg-neutral-100'>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <body className={inter.className}>
        <UiProvider>
          {/* <NextTopLoader color='#ea580c'/> */}
          <div className='min-w-screen min-h-screen h-full  text-black'>
            {children}
          </div>
        </UiProvider>
      </body>
    </html>
  )
}
