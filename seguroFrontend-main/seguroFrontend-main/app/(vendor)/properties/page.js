"use client"
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import { EditIcon } from '@/assets/js/EditIcon';
import apiService from '@/services/apiService';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from '@nextui-org/react';
import Cookies from 'js-cookie';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { CardElement, Elements, PaymentRequestButtonElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { PaymentElement } from '@stripe/react-stripe-js';
import Loader from '@/components/loader/Loader';
import { useRouter } from 'next/navigation'


const columns = [
  { name: "Hotel Name", uid: "propertyname" },
  { name: "Address", uid: "address1" },
  { name: "Areas", uid: "areas" },
  // { name: "IP Address", uid: "ipaddress" },
  // { name: "Credentials", uid: "credential" },
  { name: "Subscription Plan", uid: "subscriptionPlan" },
  { name: "Plan Expiry Date", uid: "plan_expiry_date" },
  { name: "Rooms", uid: "number_of_rooms" },
  { name: "Actions", uid: "actions" },
];

const plansColumns = [
  { name: "Rooms", uid: "rooms" },
  { name: "Monthly", uid: "monthly_charge" },
  { name: "Yearly", uid: "yearly_charge" },
];

const stripePromise = loadStripe('pk_live_51Ma2U8LQhCIOwz7KOePHeYg09tz3k4g2DV4SVdQhQibatuI6KSJpl8Zno6QrUgEgcSSJp53fw8X9IGKvlMuDYxmt007gAFhLEg');
// const stripePromise = loadStripe('pk_test_51OCwwOSJzXFqRC65zQcyRh7d5ceytKpgxnHH0DvIICg9WkgdcWQtywVNuKdFdInlznwulhyT03F5MOSCV5SGRhtt00YbhuGICh');

const CheckoutForm = (props) => {
  const { planInterval, amount, successCallback, setClientSecretKey } = props
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true)
      const paymentMethod = await stripe.createPaymentMethod({
        card: elements.getElement("card"),
        type: "card",
      });
      if (paymentMethod.error) {
        setIsLoading(false)
        setPaymentError(paymentMethod.error.message)
        return
      }

      const result = await apiService.post("vendor/stripesPaymentIntent", {
        "amount": amount,
        "email": Cookies.get('userEmail'),
        "name": Cookies.get('userName'),
        "paymentMethod": paymentMethod.paymentMethod.id,
        "paymentType": "nzd",
        "paymentInterval": planInterval
      })
      console.log(result)

      if (result.error) {
        setIsLoading(false)
        setPaymentError(result.error.message)
        setTimeout(() => {
          setPaymentError('')
        }, 1000)
        // Show error to your customer (for example, payment details incomplete)
        console.log(result.error.message);
      } else {
        const confirm = await stripe.confirmCardPayment(result.data.clientSecret)
        console.log(confirm)
        setIsLoading(false)
        // Your customer will be redirected to your `return_url`. For some payment
        // methods like iDEAL, your customer will be redirected to an intermediate
        // site first to authorize the payment, then redirected to the `return_url`.

        // Payment was successful, call your API
        successCallback(paymentMethod, result.data)
      }
    }
    catch (err) {
      setIsLoading(false)
      console.log(err)
    }
  };
  return (
    <>
      <Loader isVisible={isLoading} />
      <form onSubmit={handlePaymentSubmit}>
        {paymentError !== '' && <p className='text-xs text-red-500 mb-2'>{paymentError}</p>}
        <CardElement className='border-2 border-gray-300 rounded-lg p-4 m-2' />
        <div className='gap-2'>
          <Button type='submit' color='primary' className='m-2'>Submit</Button>
          <Button type='button' onClick={() => setClientSecretKey('')} variant='flat' className='m-2' color='primary'>Cancel Payment</Button>
        </div>
      </form>
    </>
  );
};

const page = () => {
  const router = useRouter();
  const fetcher = (args) => (apiService.get(args.api, args.body))
  const { data, mutate, isLoading } = useSWR({ api: 'vendor/propertiesByUserId/' + Cookies.get("userId"), body: {} }, fetcher)
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange, onClose: onEditClose } = useDisclosure();
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenDeleteChange, onClose: onCloseDelete } = useDisclosure()
  const { isOpen: isOpenCancelSubscription, onOpen: onOpenCancelSubscription, onOpenChange: onOpenCancelSubscriptionChange, onClose: onCloseCancelSubscription } = useDisclosure()
  const { isOpen: isOpenUpgrade, onOpen: onOpenUpgrade, onOpenChange: onOpenUpgradeChange, onClose: onCloseUpgrade } = useDisclosure()
  const [activeCardId, setActiveCardId] = useState('')
  const [clientSecretKey, setClientSecretKey] = useState('')
  const [activePropertyId, setActivePropertyId] = useState('')
  const [activePlanType1, setActivePlanType1] = useState('')
  const [activeProperty, setActiveProperty] = useState({})
  const [activePlan, setActivePlan] = useState({})
  const [subscriptions, setSubscriptions] = useState([])
  const [Areas, setAreas] = useState([
    {
      areaName: '',
      areaIp: '',
      areaUnlockDuration: ''
    }
  ])

  const addMoreArea = () => {
    setAreas([
      ...Areas,
      {
        areaName: '',
        areaIp: '',
        areaUnlockDuration: ''
      }
    ]);
  }

  const handleAreaChange = (index, field, e) => {
    const allAreas = [...Areas];
    allAreas[index][field] = e.target.value;
    setAreas(allAreas);
  }

  const areaPage = (propertyId) => {
    localStorage.setItem('propertyId', propertyId);
    router.push('/areas');
  }

  let activeplanIndex = ''
  let activeplanType = ''
  let activePropertyIndex = ''


  useEffect(() => {
    !isOpen && setActiveCardId('')
    !isOpen && (activeplanIndex = "")
  }, [isOpen])

  const openUpgradeModal = (propertyId, activePlan, planType, property) => {
    console.log(propertyId)
    setClientSecretKey('')

    onOpenUpgrade()
    setActiveProperty(property)
    activeplanIndex = activePlan
    activePropertyIndex = propertyId
    activeplanType = planType
  }


  const openCancelSubscriptionModal = (user) => {
    setActiveProperty(user)
    onOpenCancelSubscription()
  }

  const openEditModal = (data) => {
    console.log(data)
    setActiveProperty(data)
    onEditOpen()
  }
  const openDeleteModal = (data) => {
    console.log(data)
    setActiveProperty(data)
    onOpenDelete()
  }

  const getClientSecretFromServer = async (amount, plan) => {
    setActivePlan(plan)
    // Fetch the client secret dynamically from your server
    setClientSecretKey('ssss')
  };

  const paymentOptions = {
    // passing the client secret obtained from the server
    clientSecret: clientSecretKey,
  }

  const buyPropertySubscription = async (propertyId, plan, planType) => {
    try {
      setActivePlan(plan)
      console.log(propertyId)
      setActivePropertyId(propertyId)
      setActivePlanType1(planType)
      if (planType == "M") {
        await getClientSecretFromServer(plan.monthly_charge, plan)

      } else if (planType == "Y") {

        await getClientSecretFromServer(plan.yearly_charge, plan)
      }
      console.log({ propertyId, plan, planType })

    } catch (err) {
      console.log(err)
      alert("Failed to buy Subscription")
    }
  }

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case 'plan_expiry_date':
        return cellValue == null ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case "areas":
        return (
          <div>
            <button type='button' onClick={() => { areaPage(user.propertyid) }} className='bg-orange-600 text-sm rounded-md text-white py-1 px-2'>Common Areas</button>
          </div>
        );
      // case "ipaddress":
      //   return (
      //     <div>
      //       <p>IP: {user.propertyIpAddress}</p>
      //       <p>Unlock Duration: {user.propertyUnlockDuration}</p>
      //     </div>
      //   );
      // case "credential":
      //   return (
      //     <div>
      //       <p>Password: {user.password}</p>
      //     </div>
      //   );
      case "actions":
        return (
          <div className="relative flex items-center gap-2 ">
            <Tooltip className='text-black' content="Edit">
              <span onClick={() => openEditModal(user)} className="text-lg  cursor-pointer active:opacity-50">
                <EditIcon />
              </span>
            </Tooltip>
            <Tooltip className='text-black' content="Delete">
              <span onClick={() => openDeleteModal(user)} className="text-lg cursor-pointer active:opacity-50 text-red-500">
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      case "subscriptionPlan":
        return (<>
          <span className='gap-2 flex items-center'>
            {user['subscription'].to_rooms_number == undefined ? "Trial" :
              (
                user['plantype'] == 'M' ?
                  "Monthly (" + user['subscription'].from_rooms_number + " - " + user['subscription'].to_rooms_number + ")" :
                  user['plantype'] == 'Y'
                  && "Yearly (" + user['subscription'].from_rooms_number + " - " + user['subscription'].to_rooms_number + ")"
              )}
            {user['subscription'].to_rooms_number == undefined ?
              <Button
                color='primary'
                onClick={() => openUpgradeModal(user['propertyid'], user['subscription'].planid, user['plantype'], user)}
                size='sm'>Purchase
              </Button> : <Button
                color='primary'
                onClick={() => openUpgradeModal(user['propertyid'], user['subscription'].planid, user['plantype'], user)}
                size='sm'>Upgrade
              </Button>
            }
            {user['subscription'].to_rooms_number !== undefined &&
              <Button
                color='danger'
                onClick={() => openCancelSubscriptionModal(user)}
                size='sm'>End Subscription
              </Button>}
          </span>
        </>)
      default:
        return cellValue;
    }
  }, []);
  const renderBuyPlanCell = React.useCallback((plans, columnKey, activePropId) => {
    const cellValue = plans[columnKey];
    switch (columnKey) {
      case "rooms":
        return plans['from_rooms_number'] + " - " + plans['to_rooms_number']
      case "monthly_charge": return (<div className="flex gap-2 justify-around items-center">
        <p className="text-bold text-sm capitalize">{cellValue}</p>
        <Button
          size='sm'
          color='primary'
          onClick={() => buyPropertySubscription(activePropId, plans, "M")}
        >Buy Now</Button>
      </div>)
      case "yearly_charge": return (<div className="flex justify-around gap-2 items-center">
        <p className="text-bold text-sm capitalize">{cellValue}</p>
        <Button
          size='sm'
          color='primary'
          onClick={() => buyPropertySubscription(activePropId, plans, "Y")}
        >Buy Now</Button>
      </div>)

      default:
        return cellValue;
    }
  }, []);
  const renderUpgradePlanCell = React.useCallback((plans, columnKey) => {
    console.log(plans)
    const cellValue = plans[columnKey];
    switch (columnKey) {
      case "rooms":
        return plans['from_rooms_number'] + " - " + plans['to_rooms_number']
      case "monthly_charge": return (<div className="flex gap-2 justify-around items-center">
        <p className="text-bold text-sm capitalize">{cellValue}</p>
        <Button
          size='sm'
          color='primary'
          onClick={() => buyPropertySubscription(activePropertyIndex, plans, "M")}
          isDisabled={activeplanIndex == plans['planid'] && activeplanType == 'M'}
        >Buy Now</Button>
      </div>)
      case "yearly_charge": return (<div className="flex justify-around gap-2 items-center">
        <p className="text-bold text-sm capitalize">{cellValue}</p>
        <Button
          size='sm'
          color='primary'
          onClick={() => buyPropertySubscription(activePropertyIndex, plans, "Y")}
          isDisabled={activeplanIndex == plans['planid'] && activeplanType == 'Y'}
        >Buy Now</Button>
      </div>)

      default:
        return cellValue;
    }
  }, []);

  const addNewProperty = async (e) => {
    e.preventDefault();

    const result = await apiService.post('vendor/property', {
      "userId": Cookies.get('userId'),
      "propertyName": e.target['name'].value,
      "address": e.target['address'].value,
      "city": e.target['city'].value,
      // "password": e.target['password'].value,
      "rooms": e.target['rooms'].value,
      // "propertyIpAddress": e.target['propertyIpAddress'].value,
      // "propertyUnlockDuration": e.target['propertyUnlockDuration'].value,
      "propertyIpAddress": null,
      "propertyUnlockDuration": null,
      // "areas": Areas
    })
    console.log(result)
    setActiveProperty(result.data)
    setActiveCardId(result.data.propertyid)
    mutate()
  }
  const editProperty = async (e) => {
    e.preventDefault();

    const result = await apiService.put('vendor/property/' + activeProperty.propertyid, {
      "propertyName": e.target['name'].value,
      "address": e.target['address'].value,
      "city": e.target['city'].value,
      // "password": e.target['password'].value,
      "rooms": e.target['rooms'].value,
      // "propertyIpAddress": e.target['propertyIpAddress'].value,
      // "propertyUnlockDuration": e.target['propertyUnlockDuration'].value
    })
    alert(result.message)
    mutate()
    onEditClose()
  }
  const deleteProperty = async (e) => {
    e.preventDefault()

    const result = await apiService.drop('vendor/property/' + activeProperty.propertyid)
    mutate()
    onCloseDelete()
  }

  const cancelSubscriptionProperty = async (e) => {
    e.preventDefault()
    console.log(activeProperty)
    try {
      const cancelPaymentIntent = await apiService.post('vendor/cancelPaymentSubscription', {
        "userId": Cookies.get('userId'),
        "propertyId": activeProperty.propertyid
      })

      console.log(cancelPaymentIntent)

      const cancelPropertySubscription = await apiService.post('vendor/removePropertySubscription', {
        "propertyId": activeProperty.propertyid
      })

      console.log(cancelPropertySubscription)
      alert("Subscription cancelled successfully")
      onCloseCancelSubscription()

    } catch (err) {
      console.log(err)
      alert("Failed to cancel subscription")
    }


  }

  const updateSubscription = async (paymentMethod, response) => {
    console.log({ paymentMethod, response })
    await apiService.post("vendor/upgradePropertySubscription/" + activePropertyId, {
      "userId": Cookies.get('userId'),
      "planId": activePlan.planid,
      "planType": activePlanType1,
      "paymentMethod": paymentMethod.paymentMethod.id,
      "paymentReference": response.data.id
    });

    // Display success message~
    alert("Subscription bought successfully");

    // You can perform other actions like updating state, closing modals, etc.
    mutate();
    onClose();
    onCloseUpgrade();
  }

  useEffect(() => {
    apiService.get('admin/subscription/').then(subs => setSubscriptions(subs))
  }, [])

  return (
    <>
      <div className='px-4 pt-10 sm:ml-28'>
        <div className='flex flex-col sm:flex-row gap-2 justify-between'>

          <h1 className='text-3xl font-bold'>Properties</h1>
          <Button className='bg-slate-800 text-white font-bold' onClick={onOpen}>
            + Create New Property
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
          <TableBody emptyContent={isLoading ? "Loading..." : "Nothing to Display"} items={!isLoading ? data.data : []}>
            {(item) => (
              <TableRow key={item.propertyid}>
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
      </div>

      {/* Create  */}
      <Modal placement='center' size='lg' isOpen={isOpen} onOpenChange={onOpenChange}>
        {activeCardId == "" ?
          <ModalContent>
            {(onClose) => (
              <form onSubmit={addNewProperty}>
                <ModalHeader className="flex flex-col gap-1 text-black">Add Property</ModalHeader>
                <ModalBody className='text-black'>
                  <Input
                    label="Name"
                    name="name"
                    type='text'
                    isRequired
                    labelPlacement="inside"
                  />
                  <Input
                    label="Address"
                    name="address"
                    type='text'
                    isRequired
                    labelPlacement="inside"
                  />
                  <Input
                    label="City"
                    name="city"
                    type='text'
                    isRequired
                    labelPlacement="inside"
                  />
                  {/* <Input
                    label="Password"
                    name="password"
                    type='text'
                    labelPlacement="inside"
                  /> */}
                  {/* <div className='grid grid-cols-2 gap-2'>
                    <Input
                      label="IP Address"
                      name="propertyIpAddress"
                      type='text'
                      labelPlacement="inside"
                    />
                    <Input
                      label="Unlock Duration"
                      name="propertyUnlockDuration"
                      min={0}
                      step={1}
                      type='number'
                      labelPlacement="inside"
                    />
                  </div> */}
                  {/* <div>
                    {
                      Areas.map((item, index) => (
                        <div className='grid grid-cols-3 gap-2 my-2' key={index}>
                          <Input
                            label="Area"
                            name="area"
                            type='text'
                            labelPlacement="inside"
                            value={item.areaName}
                            isRequired
                            onChange={(e) => { handleAreaChange(index, 'areaName', e) }}
                          />
                          <Input
                            label="Area IP Address"
                            name="areaIp"
                            type='text'
                            labelPlacement="inside"
                            value={item.areaIp}
                            isRequired
                            onChange={(e) => { handleAreaChange(index, 'areaIp', e) }}
                          />
                          <Input
                            label="Unlock Duration"
                            name="areaUnlockDuration"
                            min={0}
                            step={1}
                            type='number'
                            labelPlacement="inside"
                            value={item.areaUnlockDuration}
                            isRequired
                            onChange={(e) => { handleAreaChange(index, 'areaUnlockDuration', e) }}
                          />
                        </div>
                      ))
                    }

                    <div className='my-2 text-center'>
                      <button type='button' onClick={addMoreArea} className='bg-orange-500 hover:bg-orange-600 rounded-md text-white text-sm py-1 px-3'>Add More</button>
                    </div>
                  </div> */}
                  <Input
                    label="Rooms"
                    name="rooms"
                    isRequired
                    min={0}
                    type='number'
                    labelPlacement="inside"
                  />
                  <Input
                    label="Logo :"
                    name="logo"
                    type='file'
                    labelPlacement="outside-left"
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
          </ModalContent> :
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-black">Buy Plan</ModalHeader>
                <ModalBody className='text-black'>
                  <Table aria-label="Example table with custom cells">
                    <TableHeader columns={plansColumns}>
                      {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                          {column.name}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody items={subscriptions}>
                      {(item) => (
                        activeProperty.number_of_rooms >= item.from_rooms_number && activeProperty.number_of_rooms <= item.to_rooms_number &&
                        <TableRow key={item.planid}>
                          {(columnKey) => <TableCell>{renderBuyPlanCell(item, columnKey, activeCardId)}</TableCell>}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ModalBody>
                <ModalFooter>
                  <Button type='button' color="primary" onPress={onClose}>
                    Continue as Trial
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        }
      </Modal>

      {/* Upgrade  */}

      <Modal placement='center' size='lg' isOpen={isOpenUpgrade} onOpenChange={onOpenUpgradeChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">Buy Plan</ModalHeader>
              <ModalBody className='text-black'>
                {clientSecretKey == '' ?
                  <Table aria-label="Subscription Plans" className='h-100 overflow-y-auto'>
                    <TableHeader columns={plansColumns}>
                      {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                          {column.name}
                        </TableColumn>
                      )}
                    </TableHeader>
                    <TableBody items={subscriptions}>
                      {(item) => (
                        activeProperty.number_of_rooms >= item.from_rooms_number && activeProperty.number_of_rooms <= item.to_rooms_number &&
                        <TableRow key={item.planid}>
                          {(columnKey) => <TableCell>{renderUpgradePlanCell(item, columnKey)}</TableCell>}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table> :
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      planInterval={activePlanType1 == "M" ? "month" : "year"}
                      amount={activePlanType1 == "M" ? activePlan.monthly_charge : activePlan.yearly_charge}
                      successCallback={updateSubscription}
                      setClientSecretKey={setClientSecretKey}
                    />
                  </Elements>}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* cancel subscription  */}
      <Modal placement='center' isOpen={isOpenCancelSubscription} onOpenChange={onOpenCancelSubscriptionChange}>
        <ModalContent>
          <form onSubmit={cancelSubscriptionProperty}>

            <ModalHeader className="flex flex-col gap-1 text-black">End subscription for this Property?</ModalHeader>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onPress={onCloseCancelSubscription}>
                Close
              </Button>
              <Button type='submit' color="primary">
                End Subscription
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit */}

      <Modal placement='center' size='lg' isOpen={isEditOpen} onOpenChange={onEditOpenChange}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={editProperty}>
              <ModalHeader className="flex flex-col gap-1 text-black">Edit Property</ModalHeader>
              <ModalBody className='text-black'>
                <Input
                  label="Name"
                  name="name"
                  defaultValue={activeProperty.propertyname}
                  type='text'
                  isRequired
                  labelPlacement="inside"
                />
                <Input
                  label="Address"
                  name="address"
                  defaultValue={activeProperty.address1}
                  type='text'
                  isRequired
                  labelPlacement="inside"
                />
                <Input
                  label="City"
                  name="city"
                  defaultValue={activeProperty.city}
                  type='text'
                  isRequired
                  labelPlacement="inside"
                />
                {/* <Input
                  label="Password"
                  name="password"
                  defaultValue={activeProperty.password}
                  type='text'
                  labelPlacement="inside"
                /> */}
                {/* <div className='grid grid-cols-2 gap-2'>
                  <Input
                    label="IP Address"
                    name="propertyIpAddress"
                    defaultValue={activeProperty.propertyIpAddress}
                    type='text'
                    labelPlacement="inside"
                  />
                  <Input
                    label="Unlock Duration"
                    name="propertyUnlockDuration"
                    defaultValue={activeProperty.propertyUnlockDuration}
                    min={0}
                    step={1}
                    type='number'
                    labelPlacement="inside"
                  />
                </div> */}
                <Input
                  label="Rooms"
                  name="rooms"
                  defaultValue={activeProperty.number_of_rooms}
                  isRequired
                  type='number'
                  min={0}
                  labelPlacement="inside"
                />
                <Input
                  label="Logo :"
                  name="logo"
                  type='file'
                  labelPlacement="outside-left"
                />
              </ModalBody>
              <ModalFooter>
                <Button type='button' color="danger" variant="light" onPress={onEditClose}>
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

      {/* delete  */}
      <Modal placement='center' isOpen={isOpenDelete} onOpenChange={onOpenDeleteChange}>
        <ModalContent>
          <form onSubmit={deleteProperty}>

            <ModalHeader className="flex flex-col gap-1 text-black">Delete this Property?</ModalHeader>
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