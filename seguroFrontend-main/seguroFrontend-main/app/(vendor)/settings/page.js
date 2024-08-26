"use client"
import { EyeFilledIcon } from '@/assets/js/EyeFilledIcon'
import { EyeSlashFilledIcon } from '@/assets/js/EyeSlashFilledIcon'
import apiService from '@/services/apiService'
import { Button, Divider, Input } from '@nextui-org/react'
import Cookies from 'js-cookie'
import moment from 'moment'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
// import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const page = () => {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')

  const [userDetails, setUserDetails] = useState({})

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [loading,setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false);
  const [isOldVisible, setIsOldVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleOldVisibility = () => setIsOldVisible(!isOldVisible);


   const saveTemplate = async(e) =>{
    e.preventDefault()
    await apiService.put('emailTemplate',{
      "body": body,
      "subject": subject,
      "type": "new_room",
      "id": Cookies.get('userId')
    }).then(data => alert(data.message))
   }

   const fetchTemplate = async() =>{
    apiService.post('emailTemplate',{
      "type": "new_room",
      "id": Cookies.get('userId')
    }).then(data=>{
      setBody(data.data.body),
      setSubject(data.data.subject)
      setLoading(false)
      console.log(data)
    })
   }


  const changePassword = async () => {
    await apiService.post('changePassword/' + Cookies.get('userId'), {
      "oldPassword": oldPass,
      "newPassword": newPass
    }).then(data => {
      alert(data.message)
      setNewPass("")
      setOldPass("")
    }).catch(err => alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message))
  }

  const fetchVendorDetails = async () =>{
    const user = await apiService.get('admin/vendor/'+Cookies.get('userId'))
    setUserDetails(user.data)
    console.log(user)
    
  }

  const saveCheckinCheckOutTime = async(e) =>{
    e.preventDefault()
    console.log(e.target['checkinTime'].value)
    const response = await apiService.post('vendor/setCheckinCheckoutTime',{
      "userId": Cookies.get('userId'),
      "checkInTime": e.target['checkinTime'].value,
      "checkOutTime": e.target['checkoutTime'].value
    }
    )
    alert(response.message)
    console.log(response)
  }

  const handleInputChange = (name, value) => {
    setUserDetails(prevUserDetails => ({
      ...prevUserDetails,
      [name]: value,
    }));
  };

  useEffect(()=>{
      fetchVendorDetails()
      fetchTemplate()
      console.log(moment(userDetails.default_checkout_time,"HH:mm:ss").format('LT'))
  },[])
  return (
    <div className='px-4 pt-10 sm:ml-28'>
      <div className='flex flex-col sm:flex-row gap-2 justify-between'>

        <h1 className='text-3xl font-bold'>Settings</h1>

      </div>

      <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold'>Change Password <Divider className='ml-2 w-8/12 sm:w-11/12' /></div>
      <Input
        endContent={
          <button className="focus:outline-none" type="button" onClick={toggleOldVisibility}>
            {isOldVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
        type={isOldVisible ? "text" : "password"}
        value={oldPass}
        onValueChange={(val) => setOldPass(val)}
        label="Old Password:"
        variant="bordered"
        className='p-2'
        labelPlacement='outside-left' />
      <Input
        endContent={
          <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
            {isVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
        type={isVisible ? "text" : "password"}
        value={newPass}
        onValueChange={(val) => setNewPass(val)}
        label="New Password:"
        variant="bordered"
        className='p-2'
        labelPlacement='outside-left' />
      <Button onClick={() => changePassword()} color='primary' className='m-2'> Change Password</Button>

      <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold'>Defaults <Divider className='ml-2 w-8/12' /></div>
      {Object.keys(userDetails).length !== 0 &&
      <form onSubmit={saveCheckinCheckOutTime}>
        <Input
        label='Checkin Time'
        name="checkinTime"
        value={userDetails.default_checkin_time}
        type='time'
        className='w-screen ml-4 mb-2'
        variant='bordered'
        labelPlacement='outside-left'
        onChange={(e) => handleInputChange("default_checkin_time", e.target.value)}
      />
      <Input
        label='Checkout Time'
        name="checkoutTime"
        value={userDetails.default_checkout_time}
        type='time'
        className='w-screen ml-4 mb-2'
        variant='bordered'
        labelPlacement='outside-left'
        onChange={(e) => handleInputChange("default_checkout_time", e.target.value)}
      />
        <Button color='primary' type='submit' className='m-2'> Save</Button>
      </form>
      }

      <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold'>Email Template <Divider className='ml-2 w-8/12' /></div>
      <form onSubmit={saveTemplate}>
        <Input label='Subject' value={subject} onValueChange={(val) => setSubject(val)} name="subject" className='w-screen ml-4 mb-2' variant='bordered' labelPlacement='outside-left'/>
        <ReactQuill  theme="snow" value={body}  onChange={setBody} name="body" placeholder="Type here..." label="Content"/>
      <Button color='primary' type='submit' className='m-2'> Save Template</Button>

      </form>
    </div>
  )
}

export default page