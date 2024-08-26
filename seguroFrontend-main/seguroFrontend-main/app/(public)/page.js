"use client"
import { env } from '@/next.config'
import { Button, Input } from '@nextui-org/react'
import axios from 'axios'
import Cookies from 'js-cookie'
import Image from 'next/image'
import Logo from '@/assets/images/logo.svg'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LoadingButton from '@/components/LoadingButton'
import { EyeSlashFilledIcon } from '@/assets/js/EyeSlashFilledIcon'
import { EyeFilledIcon } from '@/assets/js/EyeFilledIcon'

export default function Home() {
  const [error, setError] = useState('')
  const [isLoading, setIsloading] = useState(false)

  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter()

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleForgot = () => {
    router.push('forgotPassword')
  }

  const formSubmit = async (e) => {
    setIsloading(true)
    e.preventDefault()
    setError('')
    try {

      await axios.post(env.apiUrl + 'login', {
        "loginId": e.target['email'].value,
        "password": e.target['password'].value
      }).then((resp) => {
        console.log(resp)
        Cookies.set('userId', resp.data.data.userid)
        Cookies.set('userName', resp.data.data.fullname)
        Cookies.set('userType', resp.data.data.usertype)
        Cookies.set('userEmail', resp.data.data.email)
        resp.data.data.usertype == 'A' ?
          router.push('adminDashboard') :
          router.push('grid')
      }).catch((err => {
        setIsloading(false)
        alert(err.response.data.message)
      }))
    } catch (err) {
      setIsloading(false)
      setError('Something went wrong')
    }
  }

  return (<div className='min-w-screen min-h-screen flex justify-center items-center'>
    <form className='bg-white rounded-md shadow-neutral-200 shadow-xl p-10 flex flex-col gap-5 items-center' onSubmit={formSubmit}>
      <Image src={Logo} height={120} width={120} />
      {/* <h2 className='text-xl font-bold'>Access Control</h2> */}
      {error !== "" && <span className='text-red-500 text-xs'>{error}</span>}
      <Input name="email" type="email" label="Email" isRequired />
      <Input
        name="password"
        type={isVisible ? "text" : "password"}
        label="Password"
        endContent={
          <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
            {isVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
        isRequired />

      <div className='flex justify-end w-full'>
        <button className='text-blue-500 hover:text-blue-600 hover:underline text-sm' onClick={handleForgot} type='button'>Forgot Password?</button>
      </div>

      {isLoading ? <LoadingButton /> : <Button type='submit' className='font-bold' color='primary'>Login</Button>}

    </form>
  </div>
  )
}
