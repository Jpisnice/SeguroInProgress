"use client"
import apiService from '@/services/apiService';
import { Button, Divider, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure, user } from '@nextui-org/react';
// import { Button, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from '@nextui-org/react';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr'
import { useRouter } from 'next/navigation';

const columns = [
    { name: "Area Name", uid: "areaName" },
    { name: "Unlock Duration", uid: "areaUnlockDuration" },
    { name: "Device / Ip Address", uid: "areaIpAddress" },
    // { name: "Password", uid: "password" },
];

// const properties = [
//   {
//     id: 0,
//     label: 'Property 1',
//     value: 'property1'
//   },
//   {
//     id: 1,
//     label: 'Property 2',
//     value: 'property2'
//   },
//   {
//     id: 2,
//     label: 'Property 3',
//     value: 'property3'
//   },
//   {
//     id: 3,
//     label: 'Property 4',
//     value: 'property4'
//   },
// ]

const page = () => {
    const router = useRouter()
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const fetcher = (args) => (apiService.get(args.api, args.body))
    const propertyId = typeof window !== 'undefined' ? localStorage.getItem('propertyId') : null;
    // const { data, mutate, isLoading } = useSWR({ api: propertyId ? `/vendor/areasByPropertyId/${propertyId}` : null, body: {} }, fetcher)
    const { data, mutate, isLoading } = useSWR({ api: `vendor/areasByPropertyId/${propertyId}`, body: {} }, fetcher)
    const [loader, setLoader] = useState(false)
    const [rooms, setRooms] = useState([])
    const [activePropertyId, setActivePropertyId] = useState('')

    const fetchRooms = async (id) => {
        setActivePropertyId(id)
        setLoader(true)
        const roomData = await apiService.get('vendor/areasByPropertyId/' + id)
        setRooms(roomData.data)
        setLoader(false)
    }

    const saveRooms = async () => {
        let confirmationResult = confirm("Are you sure you want to proceed?");
        if (confirmationResult) {
            const result = await apiService.post('vendor/saveAreas/' + localStorage.getItem('propertyId'), {
                areas: rooms
            })
            console.log(result);
        }
        else {
            fetchRooms(localStorage.getItem('propertyId'));
        }
    }

    const renderCell = React.useCallback((user, columnKey) => {
        const cellValue = user[columnKey];

        switch (columnKey) {
            case "areaName":
                return (
                    <Input
                        name='areaName'
                        onValueChange={(val) => {
                            setRooms((prevRooms) => {
                                // Find the room with roomId 1 and update its roomName
                                const updatedRooms = (prevRooms || []).map((room) =>
                                    room.areaId === user['areaId'] ? { ...room, areaName: val } : room
                                );
                                return updatedRooms;
                            });
                        }}
                        labelPlacement="outside"
                        value={user.areaName}
                    />
                );
            case "areaUnlockDuration":
                return (
                    <Input
                        step="any"
                        onValueChange={(val) => {
                            setRooms((prevRooms) => {
                                // Find the room with roomId 1 and update its roomName
                                const updatedRooms = (prevRooms || []).map((room) =>
                                    room.areaId === user['areaId'] ? { ...room, areaUnlockDuration: val } : room
                                );
                                return updatedRooms;
                            });
                        }}
                        name='areaUnlockDuration'
                        endContent={'secs'}
                        labelPlacement="outside"
                        value={user.areaUnlockDuration}
                    />
                );
            case "areaIpAddress":
                return (
                    <Input
                        step="any"
                        onValueChange={(val) => {
                            setRooms((prevRooms) => {
                                // Find the room with roomId 1 and update its roomName
                                const updatedRooms = (prevRooms || []).map((room) =>
                                    room.areaId === user['areaId'] ? { ...room, areaIpAddress: val } : room
                                );
                                return updatedRooms;
                            });
                        }}
                        name='areaIpAddress'
                        labelPlacement="outside"
                        value={user.areaIpAddress}
                    />
                );
            // case "password":
            //   return (
            //     <Input
            //       step="any"
            //       onValueChange={(val) => {
            //         setRooms((prevRooms) => {
            //           // Find the room with roomId 1 and update its ipAddress
            //           const updatedRooms = (prevRooms || []).map((room) =>
            //             room.roomId === user['roomId'] ? { ...room, password: val } : room
            //           );
            //           return updatedRooms;
            //         });
            //       }}
            //       labelPlacement="outside"
            //       value={cellValue}
            //     />
            //   );
            default:
                return cellValue;
        }
    }, []);

    useEffect(() => {
        !isLoading && data.data.length > 0 && fetchRooms(localStorage.getItem('propertyId'))
    }, [data])

    const addNewArea = async (e) => {
        e.preventDefault();

        let payload = {
            "areaName": e.target['areaName'].value,
            "areaIpAddress": e.target['areaIpAddress'].value,
            "areaUnlockDuration": e.target['areaUnlockDuration'].value,
            "propertyId": e.target['propertyId'].value
        }

        const res = await apiService.post('vendor/createArea', {
            areaData: payload
        });

        onClose();
        alert("Area Created Successfully!");
    }

    return (
        <>
            <div className='px-4 pt-10 sm:ml-28'>
                <div className='flex  flex-col sm:flex-row gap-2 justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold'>Areas</h1>
                    </div>

                    <div>
                        <button type='button' onClick={onOpen} className='bg-orange-600 rounded-md py-1 px-2 text-white'>Add Area</button>
                    </div>
                </div>
                {/* <div className='mt-4'>

          {!isLoading && <Select
            label="Choose Property :"
            className="max-w-xs"
            variant='bordered'
            labelPlacement='outside-left'
            defaultSelectedKeys={[data.data.length > 0 && data.data[0].propertyid.toString()]}
            onSelectionChange={(val) => fetchRooms(val.currentKey)}
          >
            {data.data.map((property) => (
              <SelectItem className="text-black" key={property.propertyid} value={property.propertyid}>
                {property.propertyname}
              </SelectItem>
            ))}
          </Select>}
        </div> */}

                <Table className='mt-10' aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody emptyContent={loader ? "Loading ..." : "No Records"} items={rooms}>
                        {(item) => (
                            <TableRow key={item.areaId}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className='flex flex-col gap-4 justify-between mt-4 sm:flex-row'>
                    {/* <div className='flex gap-4 items-center'>
            Pagination:
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={1}
              total={10}
            />
          </div> */}
                </div>
                {activePropertyId !== '' && <div className='flex justify-center mt-4'>
                    <Button onClick={() => saveRooms()} className='bg-slate-800 text-white font-bold'>
                        Save
                    </Button>
                </div>}
            </div>

            {/* Create  */}
            <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <form onSubmit={addNewArea}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Add New Area</ModalHeader>
                            <ModalBody className='text-black'>
                                <input type="hidden" name='propertyId' id='propertyId' value={localStorage.getItem('propertyId')} />
                                <Input
                                    label="Area Name"
                                    name="areaName"
                                    type='text'
                                    isRequired
                                    labelPlacement="inside"
                                />
                                <Input
                                    label="Ip Address"
                                    name="areaIpAddress"
                                    type='text'
                                    isRequired
                                    labelPlacement="inside"
                                />
                                <Input
                                    label="Unlock Duration(Sec)"
                                    name="areaUnlockDuration"
                                    type='number'
                                    min={0}
                                    isRequired
                                    labelPlacement="inside"
                                />
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
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}

export default page