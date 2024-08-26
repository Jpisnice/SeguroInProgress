"use client"
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import { EditIcon } from '@/assets/js/EditIcon';
import IconDownload from '@/assets/js/IconDownload';
import IconEmailOutline from '@/assets/js/IconEmailOutline';
import IconUnlock from '@/assets/js/IconUnlock';
import apiService from '@/services/apiService';
import { Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure, user } from '@nextui-org/react';
import Cookies from 'js-cookie';
import React, { useEffect, useRef, useState } from 'react';

import { nanoid } from 'nanoid';
import { saveSvgAsPng } from 'save-svg-as-png';
import QRCode from 'react-qr-code';
import useSWR from 'swr'
import moment from 'moment';
import { useRouter } from 'next/navigation';
import IconQrCode from '@/assets/js/IconQrCode';
import axios from 'axios';

const columns = [
    { name: "Property", uid: "propertyname" },
    { name: "Customer Name", uid: "customername" },
    { name: "Room Number", uid: "room_name" },
    { name: "Valid From", uid: "checkindatetime" },
    { name: "Valid To", uid: "checkoutdatetime" },
    { name: "Actions", uid: "actions" },
];
const getCurrentTime = async () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

const page = () => {
    const fetcher = (args) => (apiService.get(args.api, args.body))
    const { data, mutate, isLoading } = useSWR({ api: 'vendor/codesDashboard/' + Cookies.get("userId"), body: {} }, fetcher)
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isOpenQR, onOpen: onOpenQR, onOpenChange: onOpenChangeQR, onClose: onCloseQR } = useDisclosure();
    const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenChangeEdit, onClose: onCloseEdit } = useDisclosure();
    const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenDeleteChange, onClose: onCloseDelete } = useDisclosure();
    const { isOpen: isOpenUnlock, onOpen: onOpenUnlock, onOpenChange: onOpenUnlockChange, onClose: onCloseUnlock } = useDisclosure();
    const { isOpen: isOpenPropertyUnlock, onOpen: onOpenPropertyUnlock, onOpenChange: onOpenPropertyUnlockChange, onClose: onClosePropertyUnlock } = useDisclosure();
    const [activeCardId, setActiveCardId] = useState('')
    const [rooms, setRooms] = useState([])
    const [properties, setProperties] = useState([])
    const [activeCodeId, setActiveCodeId] = useState('')
    const [UnlockIp, setUnlockIp] = useState("")
    const [PropertyUnlockIp, setPropertyUnlockIp] = useState("")
    const [activeCode, setActiveCode] = useState({})
    const [alreadyCheckedInData, setAlreadyCheckedInData] = useState([])
    const [todayCheckInData, setTodayCheckInData] = useState([])
    const [upcomingCheckInData, setUpcomingCheckInData] = useState([])
    const [checkOutDate, setCheckOutDate] = useState('')
    const [checkInDate, setCheckInDate] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [activePropertyId, setActivePropertyId] = useState('')


    const [checkOutTime, setCheckOutTime] = useState(getCurrentTime())
    const [checkInTime, setCheckInTime] = useState(getCurrentTime())
    const alreadyCheckedInRef = useRef(null)
    const checkingInTodayRef = useRef(null)
    const upcomingCheckinRef = useRef(null)
    const QRRef = useRef()
    const QRRef1 = useRef()
    const router = useRouter()

    useEffect(() => {
        !isOpen && setActiveCardId('')
    }, [isOpen])

    const fetchEmailTemplate = async () => {
        const result = await apiService.post('emailTemplate', {
            'type': 'new_room',
            'id': Cookies.get('userId')
        })

        setSubject(result.data.subject)
        setBody(result.data.body)
    }
    const openQRModal = (code) => {
        setActiveCode(code)
        // setActiveCodeId(code)
        onOpenQR()
    }

    const openEditModal = (codeData) => {
        setActiveCode(codeData)
        onOpenEdit()
    }

    const openDeleteModal = async (codeId) => {
        setActiveCodeId(codeId)
        onOpenDelete()
    }

    const openUnlockModal = async (ipAddress) => {
        setUnlockIp(ipAddress)
        onOpenUnlock()
    }

    const openUnlockPropertyModal = async (ipAddress) => {
        setPropertyUnlockIp(ipAddress)
        onOpenPropertyUnlock()
    }

    const forceUnlock = async (e) => {
        e.preventDefault();

        try {
            const result = await axios.post(`http://${UnlockIp}/rpc/Switch.Set`, { 'id': 0, 'on': true });
            console.log("Force Unlock Result:");
            console.log(result);
            alert("Successfully Opened The Room Door!");
        } catch (error) {
            alert(`Exception Occured, Door Not Opened! ${error}`);
        }

        // try {
        // const payload = {
        //     id: 1,
        //     method: 'Switch.Set',
        //     params: {
        //         id: 0,
        //         on: true
        //     }
        // };

        // const result = await axios.post(`http://${UnlockIp}/rpc`, payload);
        // } catch (error) {
        //     console.log("Falied To Unlock Door!");
        // }
    }

    const forceUnlockProperty = async (e) => {
        e.preventDefault();

        try {
            const result = await axios.post(`http://${PropertyUnlockIp}/rpc/Switch.Set`, { 'id': 0, 'on': true });
            alert("Successfully Opened The Property Door!");
        } catch (error) {
            alert(`Exception Occured, Property Door Not Opened! ${error}`);
        }
    }

    const deleteCode = async (e) => {
        e.preventDefault()

        await apiService.drop('vendor/deleteCode/' + activeCodeId).then(() => onCloseDelete()).catch(({ response }) => alert(response.data.message))
        mutate()
    }

    const downloadQR = (name) => {
        // saveSvgAsPng(QRRef.current, name + ".png", { scale: 10 })

        const svgElement = QRRef.current;

        // Create a wrapper SVG element with white background and padding
        const wrapperSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        wrapperSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const padding = 10; // Padding value
        wrapperSvg.setAttribute("width", svgElement.width.baseVal.value + 2 * padding);
        wrapperSvg.setAttribute("height", svgElement.height.baseVal.value + 2 * padding);
        wrapperSvg.setAttribute("style", "background-color: white; padding: " + padding + "px"); // Set padding style

        // Calculate centering offsets
        const xOffset = padding;
        const yOffset = padding;

        // Clone the contents of the original SVG into the wrapper SVG
        const svgClone = svgElement.cloneNode(true);

        // Adjust the position of the QR code within the wrapper SVG
        svgClone.setAttribute("x", xOffset);
        svgClone.setAttribute("y", yOffset);

        // Append the QR code clone to the wrapper SVG
        wrapperSvg.appendChild(svgClone);

        // Save the wrapper SVG as PNG with white padding and centered QR code
        saveSvgAsPng(wrapperSvg, name + ".png", { backgroundColor: 'white', scale: 10 });
    };

    const downloadQR1 = (name) => {
        saveSvgAsPng(QRRef1.current, name + ".png", { scale: 10 })
    };

    function replacePlaceholders(template, replacements) {
        return template.replace(/\[(.*?)\]/g, (match, p1) => {
            // Use p1 to access the placeholder without brackets
            return replacements[p1] || match;
        });
    }

    const replacements = {
        customer_name: activeCode.customername,
        property_name: activeCode.propertyname,
        room_name: activeCode.room_name,
        checkin_date: moment(activeCode.checkindatetime).format("DD/MM/YYYY hh:mm a"),
        checkout_date: moment(activeCode.checkoutdatetime).format("DD/MM/YYYY hh:mm a"),
        vendor_name: Cookies.get("userName")
    };

    const sendEmail = async () => {

        try {
            const payloadInfo = `${activeCode.barcode}|${activeCode.checkindatetime}|${activeCode.checkoutdatetime}|${activeCode.roomid}|${activeCode.ip_address}|${activeCode.unlock_duration}|${activeCode.propertyid}|${activeCode.propertyIpAddress}|${activeCode.propertyUnlockDuration}`;
            const base64Payload = btoa(payloadInfo);

            await apiService.post('sendEmail', {
                "email": activeCode.email,
                "subject": replacePlaceholders(subject, replacements),
                "body": replacePlaceholders(body, replacements),
                "qrCode": base64Payload
                // "qrCode": activeCode.barcode.toString()
            })

            alert("Email Sent Successfully")
            // onCloseQR()
        } catch (err) {
            alert("Something went wrong")
        }
    }

    const renderCell = React.useCallback((user, columnKey) => {
        const cellValue = user[columnKey];

        switch (columnKey) {
            case "checkindatetime":
                return moment(cellValue).format("DD/MM/YYYY hh:mm a")
            case "checkoutdatetime":
                return moment(cellValue).format("DD/MM/YYYY hh:mm a")
            case "actions":
                return (
                    <div className="flex items-center gap-2 ">
                        <Tooltip className='text-black' content="Edit">
                            <p className='px-2'>
                                <span onClick={() => openEditModal(user)} className="text-lg  cursor-pointer active:opacity-50">
                                    <EditIcon className='mx-auto' />
                                </span>
                                <p className='text-[8px] italic'>Edit</p>
                            </p>
                        </Tooltip>
                        <Tooltip className='text-black' content="Qr Code">
                            <p className='px-2'>
                                <span onClick={() => openQRModal(user)} className="text-lg  cursor-pointer active:opacity-50">
                                    <IconQrCode className='mx-auto' />
                                </span>
                                <p className='text-[8px] italic'>Qr Code</p>
                            </p>
                        </Tooltip>
                        {/* <Tooltip className='text-black' content="Download">
                            <span onClick={() => openQRModal(user.barcode)} className="text-lg  cursor-pointer active:opacity-50">
                                <IconDownload />
                            </span>
                        </Tooltip> */}
                        <Tooltip className='text-black' content="Delete">
                            <p className='px-2'>
                                <span onClick={() => openDeleteModal(user.codeid)} className="text-lg cursor-pointer active:opacity-50 text-red-500">
                                    <DeleteIcon className='mx-auto' />
                                </span>
                                <p className='text-[8px] italic'>Delete</p>
                            </p>
                        </Tooltip>
                        {/* <Tooltip className='text-black' content="Door Force Open">
                            <p>
                                <span onClick={() => openUnlockModal(user.ip_address)} className="text-lg cursor-pointer active:opacity-50 text-yellow-500">
                                    <IconUnlock className='mx-auto' />
                                </span>
                                <p className='text-[8px] italic'>Door Unlock</p>
                            </p>
                        </Tooltip> */}
                        {/* <Tooltip className='text-black' content="Property Force Open">
                            <p>
                                <span onClick={() => openUnlockPropertyModal(user.propertyIpAddress)} className="text-lg cursor-pointer active:opacity-50 text-yellow-500">
                                    <IconUnlock className='mx-auto' />
                                </span>
                                <p className='text-[8px] italic'>Property Unlock</p>
                            </p>
                        </Tooltip> */}
                    </div>
                );

            default:
                return cellValue;
        }
    }, []);

    const addNewCode = async (e) => {
        e.preventDefault()
        try {
            const result = await apiService.post("vendor/createNewCode/" + Cookies.get('userId'), {
                "customerName": e.target['customerName'].value,
                "email": e.target['email'].value,
                "mobile": e.target['mobile'].value,
                "roomId": e.target['room'].value,
                "checkInDate": e.target['checkInDate'].value,
                "checkInTime": e.target['checkInTime'].value,
                "checkOutDate": e.target['checkOutDate'].value,
                "checkOutTime": e.target['checkOutTime'].value
            })

            mutate()
            onClose()
            openQRModal({ ...result.data, customername: e.target['customerName'].value, email: e.target['email'].value })
        } catch (err) {
            alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
            console.log(err)
        }

        // cards.push({
        //     id: (cards.length + 1),
        //     customerName: e.target['customerName'].value,
        //     room: e.target['room'].value,
        //     cardId: Math.random(),
        //     validFrom: e.target['checkInDate'].value,
        //     validTo: e.target['checkOutDate'].value,
        // })
        // console.log(cards)
        // onClose()
    }

    const saveCode = async (e) => {
        e.preventDefault();
        try {
            await apiService.put('vendor/updateCode/' + activeCode.codeid, {
                "roomId": e.target['room'].value,
                "checkInDate": e.target['checkInDate'].value,
                "checkInTime": e.target['checkInTime'].value,
                "checkOutDate": e.target['checkOutDate'].value,
                "checkOutTime": e.target['checkOutTime'].value
            })
            mutate()
            onCloseEdit()
            alert("Code Edited Successfully")

        } catch (err) {
            alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
            console.log(err)
        }
    }



    const fetchRoomsByUser = async () => {
        await apiService.post('vendor/roomsByUserId/' + Cookies.get("userId"), {
            'checkInDate': checkInDate == '' ? '' : moment(checkInDate + ' ' + checkInTime).format('YYYY-MM-DD HH:mm:ss'),
            'checkOutDate': checkOutDate == '' ? '' : moment(checkOutDate + ' ' + checkOutTime).format('YYYY-MM-DD HH:mm:ss')
        })
            .then(roomData =>
                setRooms(roomData.data)
            )
    }

    const checkUserProperties = async () => {
        const result = await apiService.get('vendor/propertiesByUserId/' + Cookies.get('userId'))
        setProperties(result.data)
        if (result.data.length == 0) {
            onOpen()
        }
    }

    const fetchCheckInCheckOutDate = async () => {
        const response = await apiService.get('admin/vendor/' + Cookies.get('userId'))

        setCheckInTime(response.data.default_checkin_time)
        setCheckOutTime(response.data.default_checkout_time)
    }

    useEffect(() => {
        setCheckInDate('')
        setCheckOutDate('')
    }, [isOpen, isOpenEdit])

    useEffect(() => {
        fetchEmailTemplate()
        checkUserProperties()
        fetchCheckInCheckOutDate()
    }, [])

    const tabledata = [
        { id: 1, name: 'John Doe', age: 25 },
        { id: 2, name: 'Jane Doe', age: 30 },
        // Add more data as needed
    ];

    useEffect(() => {
        if (data !== undefined) {
            const uniqueEntries = new Map();
            data.data.alreadyCheckedIn.forEach(entry => {
                uniqueEntries.set(entry.barcode, entry);
            });
            const uniqueEntriesArray = Array.from(uniqueEntries.values());

            const uniqueEntries2 = new Map();
            data.data.todayCheckIn.forEach(entry => {
                uniqueEntries2.set(entry.barcode, entry);
            });
            const uniqueEntriesArray2 = Array.from(uniqueEntries2.values());

            setAlreadyCheckedInData(uniqueEntriesArray)
            setTodayCheckInData(uniqueEntriesArray2)
            setUpcomingCheckInData(data.data.upcomingCheckIn)
        }
    }, [data])

    useEffect(() => {
        fetchRoomsByUser()
    }, [checkInDate, checkOutDate])

    return (
        <>
            <div className='px-4 pt-10 sm:ml-28'>
                <div className='flex flex-col sm:flex-row gap-2 justify-between'>
                    <div>
                        <div className='text-gray-500 font-semibold capitalize'>Hello, {Cookies.get('userName')}!</div>
                        <h1 className='text-3xl font-bold'>Current and Upcoming Codes</h1>

                    </div>
                    <Button className='bg-slate-800 text-white font-bold' onClick={onOpen}>
                        + Create New
                    </Button>
                </div>
                <div className='flex justify-start flex-col lg:flex-row md:flex-row my-3 gap-2'>
                    <Button color='primary' onClick={() => alreadyCheckedInRef.current.scrollIntoView()} startContent={<span>{alreadyCheckedInData.length}</span>}>Already Checked In </Button>
                    <Button color='primary' onClick={() => checkingInTodayRef.current.scrollIntoView()} startContent={<span>{todayCheckInData.length}</span>}>Current Bookings </Button>
                    <Button color='primary' onClick={() => upcomingCheckinRef.current.scrollIntoView()} startContent={<span>{upcomingCheckInData.length}</span>}>Upcoming Check In's </Button>
                </div>
                <div className='flex lg:flex-row md:flex-row flex-col gap-4 overflow-x-auto snap-x snap-proximity'>

                    <div ref={alreadyCheckedInRef} className='snap-start md:max-w-[80vw] lg:max-w-[90vw]'>

                        <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold md:w-[80vw] lg:w-[90vw]'>Already Checked In <Divider className='ml-2 lg:w-8/12 md:w-8/12 w-10/12' /></div>

                        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg lg:min-h-[300px] md:min-h-[300px]">
                            <div className="overflow-x-auto flex lg:flex-row md:flex-row flex-row m-4">
                                {/* Table Header */}
                                <div className="flex lg:flex-col md:flex-col flex-col bg-gray-100 text-gray-600 font-bold text-xs rounded-lg m-4">
                                    {columns.map(column =>
                                        <div className="flex-grow p-2 min-w-[100px] bg-gray-100 text-gray-600 font-bold text-xs " key={column.uid}>{column.name}</div>
                                    )}
                                </div>
                                {/* Table Body */}
                                {alreadyCheckedInData.map((item) => (
                                    <div key={item.id} className="flex lg:flex-col md:flex-col flex-col text-sm m-4">
                                        {columns.map(column =>
                                            <div className="flex-grow p-2  min-w-[100px]" key={nanoid()}>{renderCell(item, column.uid)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div ref={checkingInTodayRef} className='snap-start md:max-w-[80vw] lg:max-w-[90vw]'>


                        <div className='mt-10 mb-2 text-gray-500 font-semibold md:w-[80vw] lg:w-[90vw] flex justify-start'><p>Current Bookings</p> <Divider className='ml-2 w-8/12 translate-y-3' /></div>

                        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg lg:min-h-[300px] md:min-h-[300px]">
                            <div className="overflow-x-auto flex flex-row m-4">
                                {/* Table Header */}
                                <div className="flex flex-col bg-gray-100 text-gray-600 font-bold text-xs rounded-lg m-4">
                                    {columns.map(column =>
                                        <div className="flex-grow p-2 min-w-[100px] bg-gray-100 text-gray-600 font-bold text-xs " key={column.uid}>{column.name}</div>
                                    )}
                                </div>
                                {/* Table Body */}
                                {todayCheckInData.map((item) => (
                                    <div key={item.id} className="flex flex-col text-sm m-4">
                                        {columns.map(column =>
                                            <div className="flex-grow p-2  min-w-[100px]" key={nanoid()}>{renderCell(item, column.uid)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div ref={upcomingCheckinRef} className='snap-start md:max-w-[80vw] lg:max-w-[90vw]'>


                        <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold md:w-[80vw] lg:w-[90vw]'><p>Upcoming Check In's</p> <Divider className='ml-2 w-8/12' /></div>

                        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg lg:min-h-[300px] md:min-h-[300px]">
                            <div className="overflow-x-auto flex flex-row m-4">
                                {/* Table Header */}
                                <div className="flex flex-col bg-gray-100 text-gray-600 font-bold text-xs rounded-lg m-4">
                                    {columns.map(column =>
                                        <div className="flex-grow p-2 min-w-[100px] bg-gray-100 text-gray-600 font-bold text-xs " key={column.uid}>{column.name}</div>
                                    )}
                                </div>
                                {/* Table Body */}
                                {upcomingCheckInData.map((item) => (
                                    <div key={item.id} className="flex flex-col text-sm m-4">
                                        {columns.map(column =>
                                            <div className="flex-grow p-2  min-w-[100px]" key={nanoid()}>{renderCell(item, column.uid)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col gap-4 justify-between mt-4 sm:flex-row'>
                </div>
            </div>

            {/* Create  */}

            <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {properties.length > 0 ? (onClose) => (
                        <form onSubmit={addNewCode}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Create Code</ModalHeader>
                            <ModalBody className='text-black'>
                                <div className='flex gap-2 lg:flex-row md:flex-row flex-col'>

                                    <Input
                                        label="CheckIn Date:"
                                        name="checkInDate"
                                        type='date'
                                        value={checkInDate}
                                        onValueChange={(val) => {
                                            setCheckInDate(val)
                                            setCheckOutDate('')
                                        }}
                                        isRequired

                                        labelPlacement="outside-left"
                                    />
                                    <Input
                                        label="Time:"
                                        name="checkInTime"
                                        type='time'
                                        value={checkInTime}
                                        onValueChange={(val) => {
                                            setCheckInTime(val)
                                            setCheckOutDate('')
                                        }}
                                        labelPlacement="outside-left"
                                        className=''
                                    />
                                </div>
                                <div className='flex gap-2 lg:flex-row md:flex-row flex-col'>
                                    <Input
                                        label="CheckOut Date:"
                                        name="checkOutDate"
                                        type='date'
                                        min={checkInDate}
                                        value={checkOutDate}
                                        onValueChange={(val) => setCheckOutDate(val)}
                                        isRequired
                                        labelPlacement="outside-left"
                                    />
                                    <Input
                                        label="Time:"
                                        name="checkOutTime"
                                        type='time'
                                        value={checkOutTime}
                                        onValueChange={(val) => setCheckOutTime(val)}
                                        labelPlacement="outside-left"
                                        className=''
                                    />

                                </div>
                                {(checkInDate == '' || checkOutDate == '') && <p className='text-red-500 text-xs'>Select CheckIn CheckOut Date *</p>}
                                <Input
                                    isDisabled={checkInDate == '' || checkOutDate == ''}
                                    label="Customer Name"
                                    name="customerName"
                                    type='text'
                                    isRequired
                                    labelPlacement="inside"
                                />
                                <Input
                                    isDisabled={checkInDate == '' || checkOutDate == ''}
                                    label="Email"
                                    name="email"
                                    type='email'
                                    isRequired
                                    labelPlacement="inside"
                                />
                                <Input
                                    isDisabled={checkInDate == '' || checkOutDate == ''}
                                    label="Mobile"
                                    name="mobile"
                                    type='number'
                                    labelPlacement="inside"
                                />
                                <Select
                                    isDisabled={checkInDate == '' || checkOutDate == ''}
                                    label={properties.length > 0 ? "Select a Property" : "No Properties Created"}
                                    labelPlacement="inside"
                                    name="properties"
                                    onSelectionChange={(val) => setActivePropertyId(val.currentKey)}
                                    isRequired
                                >
                                    {properties.map((property) =>
                                        <SelectItem className='text-black' key={property.propertyid} value={property.propertyid}>
                                            {property.propertyname}
                                        </SelectItem>
                                    )}
                                </Select>
                                <Select
                                    isDisabled={checkInDate == '' || checkOutDate == ''}
                                    label={rooms.length > 0 && rooms.some(room => room.propertyid == activePropertyId) ? "Select a Room" : "No rooms available"}
                                    labelPlacement="inside"
                                    name="room"
                                    isRequired
                                >
                                    {rooms.map((room) => room.room_name !== "" && room.room_name !== null && room.propertyid == activePropertyId &&
                                        <SelectItem className='text-black' key={room.roomid} value={room.number}>
                                            {room.room_name}
                                        </SelectItem>
                                    )}
                                </Select>

                            </ModalBody>
                            <ModalFooter>
                                <Button type='button' color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button type='submit' color="primary">
                                    Add
                                </Button>
                            </ModalFooter>
                        </form>
                    ) : (onClose) => (
                        <form onSubmit={addNewCode}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Welcome to Seguro</ModalHeader>
                            <ModalBody className='text-black'>
                                <div className='flex flex-col justify-center items-center'>
                                    Looks like this is your first time here.<br />
                                    You can start by creating properties and rooms<br />
                                    <Button className='m-2' color='primary' onClick={() => router.push('properties')}>Go to Properties</Button>
                                </div>
                            </ModalBody>
                        </form>
                    )}
                </ModalContent>
            </Modal>

            {/* Edit  */}

            <Modal placement='center' isOpen={isOpenEdit} onOpenChange={onOpenChangeEdit}>
                <ModalContent>
                    {(onCloseEdit) => (
                        <form onSubmit={saveCode}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Edit Code</ModalHeader>
                            <ModalBody className='text-black'>
                                <Select
                                    label="Select a Room"
                                    labelPlacement="inside"
                                    name="room"
                                    isRequired
                                    defaultSelectedKeys={[activeCode.roomid.toString()]}
                                >
                                    {rooms.map((room) => room.room_name !== "" && room.room_name !== null &&
                                        <SelectItem className='text-black' key={room.roomid} value={room.number}>
                                            {room.room_name + " (" + room.propertyname + ")"}
                                        </SelectItem>
                                    )}
                                </Select>
                                <div className='flex gap-2'>

                                    <Input
                                        label="CheckIn Date:"
                                        name="checkInDate"
                                        type='date'
                                        defaultValue={moment(activeCode.checkindatetime).format('YYYY-MM-DD')}
                                        onValueChange={(val) => {
                                            console.log(val)
                                            setCheckInDate(val)
                                            setCheckOutDate('')
                                        }}
                                        isRequired

                                        labelPlacement="outside-left"
                                    />
                                    <Input
                                        label="Time:"
                                        name="checkInTime"
                                        type='time'
                                        defaultValue={moment(activeCode.checkindatetime).format('HH:mm')}
                                        onValueChange={(val) => {
                                            console.log(val)
                                        }}
                                        isRequired
                                        labelPlacement="outside-left"
                                    />
                                </div>
                                <div className='flex gap-2'>
                                    <Input
                                        label="CheckOut Date:"
                                        name="checkOutDate"
                                        type='date'
                                        min={checkInDate}
                                        defaultValue={moment(activeCode.checkoutdatetime).format('YYYY-MM-DD')}
                                        onValueChange={(val) => setCheckOutDate(val)}
                                        isRequired
                                        labelPlacement="outside-left"
                                    />
                                    <Input
                                        label="Time:"
                                        name="checkOutTime"
                                        type='time'
                                        defaultValue={moment(activeCode.checkoutdatetime).format('HH:mm')}
                                        isRequired
                                        labelPlacement="outside-left"
                                    />

                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button type='button' color="danger" variant="light" onPress={onCloseEdit}>
                                    Close
                                </Button>
                                <Button type='submit' color="primary">
                                    Save
                                </Button>
                            </ModalFooter>
                        </form>
                    )}
                </ModalContent>
            </Modal>

            {/* QR Modal */}
            <Modal
                backdrop="opaque"
                placement='center'
                isOpen={isOpenQR}
                onOpenChange={onOpenChangeQR}
                scrollBehavior='inside'
                motionProps={{
                    variants: {
                        enter: {
                            y: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: "easeOut",
                            },
                        },
                        exit: {
                            y: -20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn",
                            },
                        },
                    }
                }}
                className='text-black'
            >
                <ModalContent>
                    {(onCloseQR) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Room QR Code</ModalHeader>
                            <ModalBody className='flex flex-col justify-center items-center'>
                                <QRCode
                                    className='p-5 bg-white'
                                    title="Room Code"
                                    id="qrCode"
                                    ref={QRRef}
                                    value={btoa(`${activeCode.barcode}|${activeCode.checkindatetime}|${activeCode.checkoutdatetime}|${activeCode.roomid}|${activeCode.ip_address}|${activeCode.unlock_duration}|${activeCode.propertyid}|${activeCode.propertyIpAddress}|${activeCode.propertyUnlockDuration}`)}
                                    bgColor={'#fff'}
                                    fgColor={"#000"}
                                    size={"300px"}
                                    style={{ padding: 20, backgroundColor: 'white' }}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" onClick={() => downloadQR((btoa(`${activeCode.barcode}|${activeCode.checkindatetime}|${activeCode.checkoutdatetime}|${activeCode.roomid}|${activeCode.ip_address}|${activeCode.unlock_duration}|${activeCode.propertyid}|${activeCode.propertyIpAddress}|${activeCode.propertyUnlockDuration}`)).slice(0, 20))} variant="light" endContent={<IconDownload />} color='primary'>Download QR Code</Button>
                                <Button type="submit" onClick={() => sendEmail()} variant="light" endContent={<IconEmailOutline />} color='primary'>Email QR Code</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* delete  */}
            <Modal placement='center' isOpen={isOpenDelete} onOpenChange={onOpenDeleteChange}>
                <ModalContent>
                    <form onSubmit={deleteCode}>

                        <ModalHeader className="flex flex-col gap-1 text-black">Delete this Code?</ModalHeader>
                        <ModalFooter>
                            <Button type='button' color="danger" variant="light" onPress={onCloseDelete}>
                                Close
                            </Button>
                            <Button type='submit' color="primary">
                                Delete
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* force unlock modal */}
            <Modal placement='center' isOpen={isOpenUnlock} onOpenChange={onOpenUnlockChange}>
                <ModalContent>
                    <form onSubmit={forceUnlock}>
                        <ModalHeader className="flex flex-col gap-1 text-black">Force Unlock This Room Door?</ModalHeader>
                        <ModalFooter>
                            <Button type='button' color="danger" variant="light" onPress={onCloseUnlock}>
                                No
                            </Button>
                            <Button type='submit' color="primary" onPress={onCloseUnlock}>
                                Yes
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* force unlock Property modal */}
            <Modal placement='center' isOpen={isOpenPropertyUnlock} onOpenChange={onOpenPropertyUnlockChange}>
                <ModalContent>
                    <form onSubmit={forceUnlockProperty}>
                        <ModalHeader className="flex flex-col gap-1 text-black">Force Unlock This Property Door?</ModalHeader>
                        <ModalFooter>
                            <Button type='button' color="danger" variant="light" onPress={onClosePropertyUnlock}>
                                No
                            </Button>
                            <Button type='submit' color="primary" onPress={onClosePropertyUnlock}>
                                Yes
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    )
}

export default page