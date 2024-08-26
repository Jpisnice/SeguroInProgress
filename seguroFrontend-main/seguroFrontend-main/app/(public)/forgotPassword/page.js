"use client"
import { env } from '@/next.config'
import axios from 'axios';
import React, { useEffect, useState } from 'react'

export default function page() {
    const [Email, setEmail] = useState("");
    const [Message, setMessage] = useState("");

    // const fetchEmailTemplate = async () => {
    //     const result = await apiService.post('emailTemplate', {
    //         'type': 'forgot_password',
    //         'id': ""
    //     })

    //     setSubject(result.data.subject)
    //     setBody(result.data.body)
    //     console.log(result)
    // }

    // useEffect(() => {
    //     fetchEmailTemplate();
    // }, []);


    const handleChange = (e) => {
        setEmail(e.target.value);
    }

    const handleSubmit = async (e) => {
        try {
            setMessage("");
            e.preventDefault();
            let body = `<div>
                <p><b>Hello Seguro User</b></p>
                <p>Please Use The link Below To Reset Your Password.</p>
            </div>`;

            const formData = {
                email: Email,
                subject: "Seguro (Forgot Password):",
                body: body
            }

            const res = await axios.post(`${env.apiUrl}sendEmail`, formData);
            (res.status === 200) ? setMessage("Mail Sent Successfully!") : setMessage("Mail Could Not Be Sent At The Moment!");
        } catch (error) {
            setMessage("Mail Could Not Be Sent At The Moment!");
        }
    }

    return (
        <div className='w-full h-screen bg-gray-100 flex justify-center items-center'>
            <div className='p-3 lg:w-1/2 md:w-1/2 w-11/12 rounded-md shadow-2xl bg-blue-100'>
                <h1 className='text-2xl font-bold'>Forgot Password:</h1>
                <form onSubmit={handleSubmit}>
                    <div className='my-3'>
                        <label htmlFor="email">Enter Email:<span className='text-red-500'>*</span></label>
                        <input type="email" onChange={handleChange} className='p-2 rounded-md block w-full bg-white border border-black' name='email' id='email' placeholder='Enter Registered Email Id' value={Email} required />
                    </div>

                    <p className='text-center text-red-500 text-sm italic'>{Message}</p>

                    <div className='my-3 flex justify-end'>
                        <button type='submit' className='rounded-md py-1 px-2 text-white bg-blue-500 hover:bg-blue-600'>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
