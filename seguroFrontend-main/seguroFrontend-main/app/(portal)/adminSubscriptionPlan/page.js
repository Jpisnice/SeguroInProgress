"use client"
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import apiService from '@/services/apiService';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

const columns = [
    { name: "Room count from", uid: "from_rooms_number" },
    { name: "Room count to", uid: "to_rooms_number" },
    { name: "Monthly plan fee", uid: "monthly_charge" },
    { name: "Yearly plan fee", uid: "yearly_charge" },
    { name: "Action", uid: "action" },
];

var users = [
    {
        id: 1,
        roomCountFrom: "1",
        roomCountTo: "10",
        monthlyFee: "10",
        yearlyFee: "100",
    },
    {
        id: 2,
        roomCountFrom: "11",
        roomCountTo: "30",
        monthlyFee: "20",
        yearlyFee: "200",
    },
    {
        id: 3,
        roomCountFrom: "31",
        roomCountTo: "100",
        monthlyFee: "50",
        yearlyFee: "400",
    },
    {
        id: 4,
        roomCountFrom: "101",
        roomCountTo: "1000",
        monthlyFee: "150",
        yearlyFee: "1000",
    },
];

const page = () => {
    const [subscriptionData, setSubscriptionData] = useState([])
    const fetcher = (args) => (apiService.get(args.api, args.body))
    const { data, error, mutate, isLoading } = useSWR({ api: 'admin/subscription', body: {} }, fetcher)
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();
    const [activeSubscription, setActiveSubscription] = useState({})
    const [minRooms,setMinRooms] = useState('')

    console.log(data)

    const openDeleteModal = (subs) =>{
        setActiveSubscription(subs)
        onDeleteOpen()
    }

    const deleteSubscription = async(e) => {
        e.preventDefault()
        try { 
            await apiService.drop('admin/subscription/'+activeSubscription.planid)
            mutate()
            onDeleteClose()
        }catch (err){
            alert("Failed to delete subscription");
        }
    }

    const renderCell = React.useCallback((user, columnKey) => {
        const cellValue = user[columnKey];

        switch (columnKey) {
            case "action":
                return (<div className="relative flex items-center gap-2 ">
                <Tooltip className='text-black' content="Delete">
                  <span onClick={() => openDeleteModal(user)} className="text-lg cursor-pointer active:opacity-50 text-red-500">
                    <DeleteIcon />
                  </span>
                </Tooltip>
              </div>)
            case "monthly_charge":
                return (<Input
                    labelPlacement="outside"
                    className='min-w-[130px]'
                    onValueChange={(val) => setSubscriptionData((prevData) =>
                        prevData.map((item) =>
                            item.planid === user.planid ? { ...item, monthly_charge: val } : item
                        )
                    )}
                    defaultValue={cellValue}
                    endContent={
                        < div className="pointer-events-none flex items-center" >
                            <span className="text-default-400 text-small">/month</span>
                        </div >
                    }
                />);
            case "yearly_charge":
                return (<Input
                    labelPlacement="outside"
                    onValueChange={(val) => setSubscriptionData((prevData) =>
                        prevData.map((item) =>
                            item.planid === user.planid ? { ...item, yearly_charge: val } : item
                        )
                    )}
                    className='min-w-[130px]'
                    defaultValue={cellValue}
                    endContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">/year</span>
                        </div>
                    }
                />);
            default:
                return cellValue;
        }
    }, []);

    const addNewRow = async (e) => {
        e.preventDefault()
        console.log('dddd', e.target['monthlyPlanFee'].value)
        try {
            await apiService.post('admin/subscription', {
                "fromRoomsNumber": e.target['roomCountFrom'].value,
                "toRoomsNumber": e.target['roomCountTo'].value,
                "monthlyCharge": e.target['monthlyPlanFee'].value,
                "yearlyCharge": e.target['yearlyPlanFee'].value
            })
            mutate()
            onClose()

        } catch (err) {
            console.log(err)
            alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
        }
    }

    const saveSubs = async () => {
        try {
            subscriptionData.map(async (sub) => {
                await apiService.put('admin/subscription/' + sub.planid, {
                    "fromRoomsNumber": sub.from_rooms_number,
                    "toRoomsNumber": sub.to_rooms_number,
                    "monthlyCharge": sub.monthly_charge,
                    "yearlyCharge": sub.yearly_charge
                })
            })
            alert("Subscription Updated Successfully")

        } catch (err) {
            alert("Failed to Update Subscription")
        }
        console.log(subscriptionData)
    }

    useEffect(() => {
        data != undefined && setSubscriptionData(data)
    }, [data])

    return (
        <>
            <div className='px-4 pt-10 sm:ml-28'>
                <div className='flex flex-col sm:flex-row gap-2 justify-between'>

                    <h1 className='text-3xl font-bold'>Subscription Plan</h1>
                    <Button className='bg-slate-800 text-white font-bold' onClick={onOpen}>
                        + Add New Subscription
                    </Button>
                </div>

                <Table className='mt-10' aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={subscriptionData}>
                        {(item) => (
                            <TableRow key={item.planid}>
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
                <div className='flex justify-center mt-4'>
                    <Button onClick={() => saveSubs()} className='bg-slate-800 text-white font-bold'>
                        Save
                    </Button>
                </div>
            </div>
            <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <form onSubmit={addNewRow}>
                            <ModalHeader className="flex flex-col gap-1 text-black">Add Subscription</ModalHeader>
                            <ModalBody className='text-black'>
                                <Input
                                    label="Room count from"
                                    name="roomCountFrom"
                                    isRequired
                                    min={0}
                                    onValueChange={(val) => setMinRooms(parseInt(val)+1)}
                                    type='number'
                                    labelPlacement="inside"
                                />

                                <Input
                                    label="Room count to"
                                    name="roomCountTo"
                                    isRequired
                                    min={minRooms}
                                    type='number'
                                    labelPlacement="inside"
                                />
                                <Input
                                    label="Monthly Plan Fee"
                                    name="monthlyPlanFee"
                                    isRequired
                                    min={0}
                                    type='number'
                                    step="any"
                                    labelPlacement="inside"
                                    endContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-small">/month</span>
                                        </div>
                                    }
                                />
                                <Input
                                    label="Yearly Plan Fee"
                                    name="yearlyPlanFee"
                                    type='number'
                                    isRequired
                                    min={0}
                                    step="any"
                                    labelPlacement="inside"
                                    endContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-small">/year</span>
                                        </div>
                                    }
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

            
      {/* Delete */}

      <Modal placement='center' isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          <form onSubmit={deleteSubscription}>

            <ModalHeader className="flex flex-col gap-1 text-black">Delete this Subscription?</ModalHeader>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onPress={onDeleteClose}>
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