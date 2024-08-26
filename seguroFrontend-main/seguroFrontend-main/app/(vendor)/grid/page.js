"use client"
import moment from 'moment';
import Cookies from 'js-cookie';
import QRCode from 'react-qr-code';
import apiService from '@/services/apiService';
import { saveSvgAsPng } from 'save-svg-as-png';
import React, { useEffect, useRef, useState } from 'react';
import IconDownload from '@/assets/js/IconDownload';
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import { EditIcon } from '@/assets/js/EditIcon';
import IconEmailOutline from '@/assets/js/IconEmailOutline';
import { Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure, user } from '@nextui-org/react';
import { color } from 'framer-motion';
import { LeftArrowIcon } from '@/assets/js/LeftArrowIcon';
import { RightArrowIcon } from '@/assets/js/RightArrowIcon';

const page = () => {
    const getCurrentTime = async () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    const fetchEmailTemplate = async () => {
        const result = await apiService.post('emailTemplate', {
            'type': 'new_room',
            'id': Cookies.get('userId')
        })

        setSubject(result.data.subject)
        setBody(result.data.body)
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

    const propertyRecord = [];
    const today = new Date();
    const [CurrentDate, setCurrentDate] = useState(formatDate(today))
    const QRRef = useRef()
    const [TableData, setTableData] = useState([]);
    const [PropertyList, setPropertyList] = useState([]);
    const [activeCodeId, setActiveCodeId] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [activePropertyId, setActivePropertyId] = useState('')
    const [checkOutDate, setCheckOutDate] = useState('')
    const [checkInDate, setCheckInDate] = useState('')
    const [checkOutTime, setCheckOutTime] = useState(getCurrentTime())
    const [checkInTime, setCheckInTime] = useState(getCurrentTime())
    const [rooms, setRooms] = useState([])
    const [properties, setProperties] = useState([])
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isOpenQR, onOpen: onOpenQR, onOpenChange: onOpenChangeQR, onClose: onCloseQR } = useDisclosure();
    const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenChangeEdit, onClose: onCloseEdit } = useDisclosure();
    const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenDeleteChange, onClose: onCloseDelete } = useDisclosure();
    const [IpList, setIpList] = useState("");
    const [UnlockList, setUnlockList] = useState("");
    const [activeCode, setActiveCode] = useState({
        codeid: "",
        barcode: "",
        checkindatetime: "",
        checkoutdatetime: "",
        roomid: "",
        ip_address: "",
        unlock_duration: "",
        propertyid: "",
        propertyIpAddress: "",
        propertyUnlockDuration: "",
        roomPassword: "",
        propertyPassword: ""
    });

    function generateRandomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }



    const openQRModal = async (codeId) => {
        const codeData = await apiService.post('vendor/getCodeData', {
            codeId: codeId
        });

        let ipList = '';
        let unlockList = '';
        for (const area of codeData.data.areaData) {
            ipList += area.areaIpAddress + ",";
            unlockList += area.areaUnlockDuration + ",";
        }

        setIpList(ipList.slice(0, -1));
        setUnlockList(unlockList.slice(0, -1));

        setActiveCode(codeData.data);
        onOpenQR()
    }

    const openDeleteModal = async (codeId) => {
        setActiveCodeId(codeId)
        onOpenDelete()
        onCloseQR()
    }

    const openEditModal = (codeData) => {
        onCloseQR()
        onOpenEdit()
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
            // mutate()

            getTableData()
            onCloseEdit()
            alert("Code Edited Successfully")
        } catch (err) {
            alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
            console.log(err)
        }
    }

    const deleteCode = async (e) => {
        e.preventDefault()

        await apiService.drop('vendor/deleteCode/' + activeCodeId).then(() => onCloseDelete()).catch(({ response }) => alert(response.data.message))
        getTableData()
        // mutate()
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

            // mutate()

            getTableData()
            onClose()
            openQRModal(result.data.codeid)
            onOpenQR()
        } catch (err) {
            alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
            console.log(err)
        }
    }

    const getUserRooms = async () => {
        const propertyList = await apiService.get('vendor/roomDataByUserId/' + Cookies.get("userId"));
        setPropertyList(propertyList.data);
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

    const getTableData = async () => {
        try {
            const propertyList = await apiService.get('vendor/roomDataByUserId/' + Cookies.get("userId"));
            const promises = propertyList.data.map(async item => {
                const dataList = [];
                for (let i = 0; i < 14; i++) {
                    const nextDate = new Date(CurrentDate);
                    nextDate.setDate(nextDate.getDate() + i);
                    const setDate = moment(nextDate).format('YYYY-MM-DD');

                    try {
                        const roomData = await getRoomData(setDate, item.roomid);
                        const cellData = {
                            propertyName: item.propertyname,
                            roomName: item.room_name,
                            roomStatus: roomData.roomStatus,
                            codeId: roomData.codeId,
                            customerData: roomData.customerData
                        };
                        dataList.push(cellData);
                    } catch (error) {
                        console.error("Error fetching room data:", error);
                        // Handle errors if needed
                    }
                }
                return dataList;
            });

            // Wait for all promises to resolve
            const completeList = await Promise.all(promises);
            setTableData(completeList);
        } catch (error) {
            console.error("Error fetching property list:", error);
            // Handle errors if needed
        }
    };

    useEffect(() => {
        setCheckInDate('')
        setCheckOutDate('')
    }, [isOpen])


    useEffect(() => {
        fetchEmailTemplate()
        checkUserProperties();
        fetchCheckInCheckOutDate();
        getUserRooms();
    }, [])

    useEffect(() => {
        getTableData();
    }, [CurrentDate])


    useEffect(() => {
        fetchRoomsByUser()
    }, [checkInDate, checkOutDate])

    // setInterval(() => {
    //     getTableData();
    // }, 30000);

    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    const getRoomData = async (dateInfo, roomId) => {
        const result = await apiService.post('vendor/roomStatus/', {
            date: dateInfo,
            roomId: roomId
        });

        return result.data;
    }

    const nextSlide = (setDate) => {
        const nextWeekDate = new Date(setDate);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        setCurrentDate(nextWeekDate);
    }

    const previousSlide = (setDate) => {
        const previousWeekDate = new Date(setDate);
        previousWeekDate.setDate(previousWeekDate.getDate() - 7);
        setCurrentDate(previousWeekDate);
    }

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
        vendor_name: Cookies.get("userName"),
        bar_code: activeCode.barcode
    };

    const sendEmail = async () => {
        try {
            // ${btoa(activeCode.roomPassword).split('').reverse().join('')}|${btoa(activeCode.propertyPassword).split('').reverse().join('')}
            const randomString = generateRandomString(5);
            const payloadInfo = `${btoa(`${btoa(activeCode.barcode).split('').reverse().join('')}|${btoa(activeCode.checkindatetime).split('').reverse().join('')}|${btoa(activeCode.checkoutdatetime).split('').reverse().join('')}|${btoa(`${activeCode.ip_address},${IpList}`).split('').reverse().join('')}|${btoa(`${activeCode.unlock_duration},${UnlockList}`).split('').reverse().join('')}`).split('').reverse().join('')}${randomString}`;
            const base64Payload = payloadInfo;

            await apiService.post('sendEmail', {
                "email": activeCode.email,
                "subject": replacePlaceholders(subject, replacements),
                "body": replacePlaceholders(body, replacements),
                "qrCode": base64Payload
            })

            alert("Email Sent Successfully")
            // onCloseQR()
        } catch (err) {
            alert("Something went wrong")
        }
    }

    return (
        <>
            <div className='px-4 pt-10 sm:ml-28'>
                <div className='bg-white p-5 rounded-md'>
                    <div className='flex justify-between mb-2'>
                        <div className='space-x-1'>
                            <Button className='bg-slate-800 text-white' onClick={() => { previousSlide(CurrentDate) }}><LeftArrowIcon className='mx-auto' /></Button>
                            <Button className='bg-slate-800 text-white' onClick={() => { nextSlide(CurrentDate) }}><RightArrowIcon className='mx-auto' /></Button>
                        </div>

                        <div>
                            <Button className='bg-slate-800 text-white font-bold' onClick={onOpen}>
                                + Create New
                            </Button>
                        </div>
                    </div>

                    <div className='overflow-auto'>
                        <table className='w-full'>
                            <thead className='text-[11px]'>
                                <tr className='bg-gray-100'>
                                    <th className='py-3 px-5 text-gray-500'>Room Data</th>
                                    {[...Array(7)].map((_, i) => {
                                        const nextDate = new Date(CurrentDate);
                                        nextDate.setDate(nextDate.getDate() + i);
                                        return <th key={i} className='py-3 px-5 text-gray-500'>{moment(nextDate).format("DD/MM/YYYY")}</th>;
                                    })}
                                </tr>
                            </thead>

                            <tbody className='text-[14px]'>
                                {
                                    TableData.map((arrayItem, index) => {
                                        let recordPresent = propertyRecord.includes(arrayItem[0].propertyName);

                                        // Push propertyName to propertyRecord array
                                        propertyRecord.push(arrayItem[0].propertyName);

                                        return (
                                            <React.Fragment key={`fragment-${index}`}>
                                                {!recordPresent ? (
                                                    <tr key={`record-present-${index}`}>
                                                        <td className='text-center'>{arrayItem[0].propertyName}</td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                ) : (
                                                    <tr key={`record-absent-${index}`} className='hidden'>
                                                        <td>{arrayItem[0].propertyName}</td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                )}

                                                <tr key={`row-${index}`}>
                                                    <td className='text-center'>{arrayItem[0].roomName}</td>
                                                    {arrayItem.map((item, itemIndex) => {
                                                        let cellColor = "";
                                                        let bgColor = "";
                                                        let buttonVisibility = "hidden";

                                                        if (item.roomStatus == 1) {
                                                            cellColor = "text-black";
                                                            bgColor = "bg-gray-100";
                                                            buttonVisibility = "block";
                                                        } else if (item.roomStatus == 2) {
                                                            cellColor = "text-gray-500";
                                                            bgColor = "";
                                                            buttonVisibility = "block";
                                                        }

                                                        return (
                                                            <td key={`cell-${itemIndex}`} className='h-[50px] text-center'>
                                                                <div className={`flex justify-end ${bgColor} py-1`}>
                                                                    <p className={`capitalize ${cellColor}`}>{item.customerData?.customername}</p>
                                                                    <button className={`ml-2 rounded-full w-[22px] h-[22px] italic bg-slate-800 text-white text-[12px] font-bold ${buttonVisibility}`} onClick={() => openQRModal(item.codeId)}>i</button>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create  */}
            <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {properties.length > 0 ? (onClose) => (
                        <form onSubmit={addNewCode}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Create Code</ModalHeader>
                            <ModalBody className='text-black'>
                                <div className='grid grid-cols-2 gap-x-1'>
                                    <div>
                                        <label htmlFor="checkInDate" className='text-sm'>Check In Date:<span className='text-red-500'>*</span></label>
                                        <Input
                                            name="checkInDate"
                                            type='date'
                                            value={checkInDate}
                                            onValueChange={(val) => {
                                                setCheckInDate(val)
                                                setCheckOutDate('')
                                            }}
                                            isRequired
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="checkInTime" className='text-sm'>Time:<span className='text-red-500'>*</span></label>
                                        <Input
                                            name="checkInTime"
                                            type='time'
                                            value={checkInTime}
                                            onValueChange={(val) => {
                                                setCheckInTime(val)
                                                setCheckOutDate('')
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-x-1'>
                                    <div>
                                        <label htmlFor="checkOutDate" className='text-sm'>Check Out Date:<span className='text-red-500'>*</span></label>
                                        <Input
                                            name="checkOutDate"
                                            type='date'
                                            min={checkInDate}
                                            value={checkOutDate}
                                            onValueChange={(val) => setCheckOutDate(val)}
                                            isRequired
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="checkOutTime" className='text-sm'>Time:<span className='text-red-500'>*</span></label>
                                        <Input
                                            name="checkOutTime"
                                            type='time'
                                            value={checkOutTime}
                                            onValueChange={(val) => setCheckOutTime(val)}
                                        />
                                    </div>
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
                                <div className='grid grid-cols-2 gap-x-1'>
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
                                </div>

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
                className='text-black'>

                <ModalContent>
                    {(onCloseQR) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Room Details</ModalHeader>
                            <ModalBody className='flex flex-col justify-center items-center'>
                                <div className='flex justify-end w-full'>
                                    <Tooltip className='text-black mr-1' content="Edit">
                                        <p className='px-2'>
                                            <span onClick={() => openEditModal(activeCode.codeid)} className="text-lg  cursor-pointer active:opacity-50">
                                                <EditIcon className='mx-auto' />
                                            </span>
                                            <p className='text-[8px] italic'>Edit</p>
                                        </p>
                                    </Tooltip>

                                    <Tooltip className='text-black' content="Delete">
                                        <p className='px-2'>
                                            <span onClick={() => openDeleteModal(activeCode.codeid)} className="text-lg cursor-pointer active:opacity-50 text-red-500">
                                                <DeleteIcon className='mx-auto' />
                                            </span>
                                            <p className='text-[8px] italic'>Delete</p>
                                        </p>
                                    </Tooltip>
                                </div>

                                <div className='my-2 space-y-2'>
                                    <p className='capitalize'><b>Customer:</b> {activeCode.customername}</p>
                                    {/* <p><b>Property:</b> {activeCode.propertyname}</p>
                                    <p><b>Room:</b> {activeCode.room_name}</p>
                                    <p><b>Valid From:</b> {moment(activeCode.checkindatetime).format("DD/MM/YYYY hh:mm a")}</p>
                                    <p><b>Valid To:</b> {moment(activeCode.checkoutdatetime).format("DD/MM/YYYY hh:mm a")}</p> */}
                                </div>
                                {/* ${btoa(activeCode.roomPassword).split('').reverse().join('')}|${btoa(activeCode.propertyPassword).split('').reverse().join('')} */}

                                <QRCode
                                    className='bg-white'
                                    title="Room Code"
                                    id="qrCode"
                                    ref={QRRef}
                                    value={`${btoa(`${btoa(activeCode.barcode).split('').reverse().join('')}|${btoa(activeCode.checkindatetime).split('').reverse().join('')}|${btoa(activeCode.checkoutdatetime).split('').reverse().join('')}|${btoa(`${activeCode.ip_address},${IpList}`).split('').reverse().join('')}|${btoa(`${activeCode.unlock_duration},${UnlockList}`).split('').reverse().join('')}`).split('').reverse().join('')}${generateRandomString(5)}`}
                                    bgColor={'#fff'}
                                    fgColor={"#000"}
                                    size={"300px"}
                                    level="L"
                                    style={{ backgroundColor: 'white' }}
                                />
                                <p className='font-bold text-center mt-2'>{activeCode.barcode}</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" onClick={() => downloadQR((`${btoa(`${btoa(activeCode.barcode).split('').reverse().join('')}|${btoa(activeCode.checkindatetime).split('').reverse().join('')}|${btoa(activeCode.checkoutdatetime).split('').reverse().join('')}|${btoa(`${activeCode.ip_address},${IpList}`).split('').reverse().join('')}|${btoa(`${activeCode.unlock_duration},${UnlockList}`).split('').reverse().join('')}`).split('').reverse().join('')}${generateRandomString(5)}`).slice(0, 20))} variant="light" endContent={<IconDownload />} color='primary'>Download QR Code</Button>
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
        </>
    )
}

export default page