"use client"
import axios from 'axios';
import { env } from '@/next.config'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function page({ params }) {
    var token = params.id;
    const router = useRouter();

    useEffect(() => {
        checkToken(token);
    }, [token]);

    const [Message, setMessage] = useState("");
    const [Field, setField] = useState({
        password: "",
        confirmPassword: "",
        token: token
    });

    const checkToken = async (token) => {
        try {
            const tokenData = {
                token: token
            }

            const res = await axios.post(`${env.apiUrl}checkToken`, tokenData);

            if (res.status === 404) {
                router.push('/');
            }
        } catch (error) {
            router.push('/');
        }
    }

    const handleChange = (e) => {
        setField({
            ...Field,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            if (Field.password !== Field.confirmPassword) {
                setMessage("Password Mismatch!");
            }
            else {
                const res = await axios.post(`${env.apiUrl}resetPassword`, Field);
                (res.status === 200) ? setMessage("Password Reset Successfully!") : setMessage("Password Could Not Be Reset At The Moment!");

                if (res.status === 200) {
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                }
            }
        } catch (error) {
            setMessage("Password Could Not Reset At The Moment!");
        }
    }

    return (
        <div className='w-full h-screen bg-gray-100 flex justify-center items-center'>
            <div className='p-3 lg:w-1/2 md:w-1/2 w-11/12 rounded-md shadow-2xl bg-blue-100'>
                <h1 className='text-2xl font-bold'>Reset Password:</h1>
                <form onSubmit={handleSubmit}>
                    <div className='my-3'>
                        <label htmlFor="password">Enter New Password:<span className='text-red-500'>*</span></label>
                        <input type="password" onChange={handleChange} value={Field.password} className='p-2 rounded-md block w-full bg-white border border-black' name='password' id='password' placeholder='Enter New Password' required />
                    </div>

                    <div className='my-3'>
                        <label htmlFor="confirmPassword">Confirm Password:<span className='text-red-500'>*</span></label>
                        <input type="password" onChange={handleChange} value={Field.confirmPassword} className='p-2 rounded-md block w-full bg-white border border-black' name='confirmPassword' id='confirmPassword' placeholder='Confirm Password' required />
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