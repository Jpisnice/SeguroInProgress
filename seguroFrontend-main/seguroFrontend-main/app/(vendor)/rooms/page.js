"use client"
import apiService from '@/services/apiService';
import { Button, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from '@nextui-org/react';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr'
import { useRouter } from 'next/navigation';

const columns = [
  { name: "Room Number", uid: "roomName" },
  { name: "Unlock Duration", uid: "unlockDuration" },
  { name: "Device / Ip Address", uid: "ipAddress" },
  // { name: "Password", uid: "password" },
];

const properties = [
  {
    id: 0,
    label: 'Property 1',
    value: 'property1'
  },
  {
    id: 1,
    label: 'Property 2',
    value: 'property2'
  },
  {
    id: 2,
    label: 'Property 3',
    value: 'property3'
  },
  {
    id: 3,
    label: 'Property 4',
    value: 'property4'
  },
]

const page = () => {
  const router = useRouter()
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const fetcher = (args) => (apiService.get(args.api, args.body))
  const { data, mutate, isLoading } = useSWR({ api: 'vendor/propertiesByUserId/' + Cookies.get("userId"), body: {} }, fetcher)
  const [loader, setLoader] = useState(false)
  const [rooms, setRooms] = useState([])
  const [activePropertyId, setActivePropertyId] = useState('')

  const fetchRooms = async (id) => {
    setActivePropertyId(id)
    setLoader(true)
    const roomData = await apiService.get('vendor/roomsByPropertyId/' + id)
    console.log(roomData)
    setRooms(roomData.data)
    setLoader(false)
  }

  const saveRooms = async () => {
    let confirmationResult = confirm("Are you sure you want to proceed?");
    if (confirmationResult) {
      const result = await apiService.post('vendor/roomsByPropertyId/' + activePropertyId, {
        rooms: rooms
      })
    }
    else {
      fetchRooms(data.data[0].propertyid);
    }
  }

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "roomName":
        return (
          <Input
            step="any"
            onValueChange={(val) => {
              setRooms((prevRooms) => {
                // Find the room with roomId 1 and update its roomName
                const updatedRooms = (prevRooms || []).map((room) =>
                  room.roomId === user['roomId'] ? { ...room, roomName: val } : room
                );
                return updatedRooms;
              });
            }}
            labelPlacement="outside"
            value={cellValue}
          />
        );
      case "unlockDuration":
        return (
          <Input
            step="any"
            onValueChange={(val) => {
              setRooms((prevRooms) => {
                // Find the room with roomId 1 and update its roomName
                const updatedRooms = (prevRooms || []).map((room) =>
                  room.roomId === user['roomId'] ? { ...room, unlockDuration: val } : room
                );
                return updatedRooms;
              });
            }}
            endContent={'secs'}
            labelPlacement="outside"
            value={cellValue}
          />
        );
      case "ipAddress":
        return (
          <Input
            step="any"
            onValueChange={(val) => {
              setRooms((prevRooms) => {
                // Find the room with roomId 1 and update its ipAddress
                const updatedRooms = (prevRooms || []).map((room) =>
                  room.roomId === user['roomId'] ? { ...room, ipAddress: val } : room
                );
                return updatedRooms;
              });
            }}
            labelPlacement="outside"
            value={cellValue}
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
    !isLoading && data.data.length > 0 && fetchRooms(data.data[0].propertyid)
  }, [data])

  return (
    <>
      <div className='px-4 pt-10 sm:ml-28'>
        <div className='flex  flex-col sm:flex-row gap-2 justify-between'>

          <h1 className='text-3xl font-bold'>Rooms</h1>
        </div>
        <div className='mt-4'>

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

        </div>

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
              <TableRow key={item.roomId}>
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

    </>
  )
}

export default page