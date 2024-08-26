"use client"
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import { EditIcon } from '@/assets/js/EditIcon';
import IconSearch from '@/assets/js/IconSearch';
import apiService from '@/services/apiService';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import ExportExcel from '@/components/ExportExcel';
import moment from 'moment';
import useSWR from 'swr';
import Cookies from 'js-cookie';

const LOCAL_STORAGE_KEY = 'customer_data';

const columns = [
  { name: "Name", uid: "customername" },
  { name: "Mobile", uid: "mobile" },
  { name: "Email", uid: "email" },
  { name: "Days Count", uid: "codeCount" },
  { name: "History", uid: "history" },
  { name: "Actions", uid: "actions" },
];
const columnsExport = [
  { name: "Name", uid: "customername" },
  { name: "Mobile", uid: "mobile" },
  { name: "Email", uid: "email" },
];
const roomsColumns = [
  { name: "Code", uid: "barcode" },
  { name: "Check In", uid: "checkindatetime" },
  { name: "Check Out", uid: "checkoutdatetime" },
];

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const page = () => {
  const fetcher = (args) => apiService.get(args.api, args.body);
  const { data: apiData, mutate, isLoading } = useSWR({ api: 'vendor/customers/' + Cookies.get('userId'), body: {} }, fetcher);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: OnEditOpenChange, onClose: onEditClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: OnAddOpenChange, onClose: onAddClose } = useDisclosure();
  const [activeCustomerData, setActiveCustomerData] = useState({});
  const [activeCustomerCodes, setActiveCustomerCodes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredCards, setFilteredCards] = useState([]);
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutTime, setCheckOutTime] = useState(getCurrentTime());
  const [checkInTime, setCheckInTime] = useState(getCurrentTime());
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activePropertyId, setActivePropertyId] = useState('');

  const fetchCheckInCheckOutDate = async () => {
    try {
      const response = await apiService.get('admin/vendor/' + Cookies.get('userId'));
      setCheckInTime(response.data.default_checkin_time);
      setCheckOutTime(response.data.default_checkout_time);
    } catch (error) {
      console.error('Failed to fetch check-in/out date from the backend', error);
    }
  };

  const checkUserProperties = async () => {
    try {
      const result = await apiService.get('vendor/propertiesByUserId/' + Cookies.get('userId'));
      setProperties(result.data);
      if (result.data.length === 0) {
        onOpen();
      }
    } catch (error) {
      console.error('Failed to fetch properties', error);
    }
  };

  const fetchRoomsByUser = async () => {
    try {
      const result = await apiService.post('vendor/roomsByUserId/' + Cookies.get("userId"), {
        checkInDate: checkInDate === '' ? '' : moment(checkInDate + ' ' + checkInTime).format('YYYY-MM-DD HH:mm:ss'),
        checkOutDate: checkOutDate === '' ? '' : moment(checkOutDate + ' ' + checkOutTime).format('YYYY-MM-DD HH:mm:ss')
      });
      setRooms(result.data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  };

 const addNewCode = async (e) => {
  e.preventDefault();
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
    });

    // Update local storage for the new customer
    const newCustomer = result.data.customer;
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${newCustomer.customerid}`, JSON.stringify(newCustomer));

    mutate();
    onAddClose();
    alert("QR Generated Successfully!");
  } catch (err) {
    alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message);
    console.log(err);
  }
};


  const updateLocalStorage = () => {
  if (apiData && apiData.data.length > 0) {
    apiData.data.forEach(customer => {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${customer.customerid}`, JSON.stringify(customer));
    });
    console.log("Local Storage Updated:", apiData.data);
  }
};


  const loadLocalData = () => {
  const localData = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(LOCAL_STORAGE_KEY)) {
      const customer = JSON.parse(localStorage.getItem(key));
      localData.push(customer);
    }
  }
  setFilteredCards(localData);
  console.log("Loaded Local Data:", localData);
};


 useEffect(() => {
  if (!isLoading) {
    if (apiData) {
      setFilteredCards(apiData.data);
      updateLocalStorage();
    } else {
      loadLocalData();
    }
    checkUserProperties();
    fetchCheckInCheckOutDate();
  }
}, [apiData]);


  useEffect(() => {
    fetchRoomsByUser();
  }, [checkInDate, checkOutDate]);

  const openCustomerHistory = (customerCodes) => {
    setActiveCustomerCodes(customerCodes);
    onOpen();
  };

  const openAddCustomerModal = (customer) => {
    setActiveCustomerData(customer);
    onAddOpen();
  };

  const openEditCustomerModal = (customer) => {
    setActiveCustomerData(customer);
    onEditOpen();
  };

  const openDeleteCustomerModal = (customer) => {
    setActiveCustomerData(customer);
    onDeleteOpen();
  };

  const renderCell = React.useCallback((customer, columnKey) => {
    const cellValue = customer[columnKey];
    switch (columnKey) {
      case "codeCount":
        return customer['codes'].length;
      case "history":
        return <Button onClick={() => openCustomerHistory(customer.codes)} color='primary'>View History</Button>;
      case "checkindatetime":
        return moment(cellValue).format("DD/MM/YYYY hh:mm a");
      case "checkoutdatetime":
        return moment(cellValue).format("DD/MM/YYYY hh:mm a");
      case "actions":
        return (
          <div className="relative flex items-center gap-2 ">
            <Tooltip className='text-black' content="Create New Booking">
              <span onClick={() => openAddCustomerModal(customer)} className="text-3xl -translate-y-1 cursor-pointer active:opacity-50 text-green-500">
                +
              </span>
            </Tooltip>
            <Tooltip className='text-black' content="Edit">
              <span onClick={() => openEditCustomerModal(customer)} className="text-lg cursor-pointer active:opacity-50">
                <EditIcon />
              </span>
            </Tooltip>
            <Tooltip className='text-black' content="Delete">
              <span onClick={() => openDeleteCustomerModal(customer)} className="text-lg cursor-pointer active:opacity-50 text-red-500">
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

 const editCustomer = async (e) => {
  e.preventDefault();
  try {
    const updatedCustomer = {
      ...activeCustomerData,
      "customerName": e.target['name'].value,
      "email": e.target['email'].value,
      "mobile": e.target['mobile'].value
    };

    await apiService.put('vendor/customer/' + activeCustomerData.customerid, updatedCustomer);

    // Update local storage for the edited customer
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${activeCustomerData.customerid}`, JSON.stringify(updatedCustomer));

    mutate();
    onEditClose();
    alert("Customer Updated Successfully");
  } catch (err) {
    console.log(err);
    alert("Error updating customer");
  }
};


const deleteCustomer = async () => {
  try {
    await apiService.delete('vendor/customer/' + activeCustomerData.customerid);

    // Remove the customer from local storage
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${activeCustomerData.customerid}`);

    mutate();
    onDeleteClose();
    alert("Customer Deleted Successfully");
  } catch (err) {
    console.log(err);
    alert("Error deleting customer");
  }
};


  const handleSearch = (e) => {
    setSearchText(e.target.value);
    const searchQuery = e.target.value.toLowerCase();
    if (searchQuery) {
      setFilteredCards(apiData?.data.filter(customer =>
        customer.customername.toLowerCase().includes(searchQuery) ||
        customer.mobile.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery)
      ));
    } else {
      setFilteredCards(apiData?.data);
    }
  };

  return (
    <div className='mt-8 flex flex-col gap-4'>
      <div className='flex justify-between w-full gap-4 flex-wrap'>
        <Input
          placeholder="Search by Customer Name, Mobile or Email"
          value={searchText}
          onChange={handleSearch}
          startContent={<IconSearch />}
        />
        <Button className="shrink" onClick={onAddOpen}>
          Create New Code
        </Button>
        <ExportExcel data={filteredCards} columns={columnsExport} filename={`vendor_customer_list`} />
      </div>

      <Table aria-label="Customer Table">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid}>{column.name}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={filteredCards}>
          {(item) => (
            <TableRow key={item.customerid}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* User History Modal */}
      <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">User History</ModalHeader>
              <ModalBody className='text-black overflow-hidden'>
                <Table className='h-[400px] overflow-scroll overflow-x-hidden' aria-label="Example table with custom cells">
                  <TableHeader columns={roomsColumns}>
                    {(column) => (
                      <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                        {column.name}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody emptyContent={"No Records."} items={activeCustomerCodes}>
                    {(item) => (
                      <TableRow key={item.codeid}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button type='button' color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Customer Modal */}
      <Modal placement='center' isOpen={isAddOpen} onOpenChange={OnAddOpenChange}>
        <ModalContent>
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
                />
              </div>
              {(checkInDate === '' || checkOutDate === '') && <p className='text-red-500 text-xs'>Select CheckIn CheckOut Date *</p>}
              <Input
                isDisabled={true}
                label="Customer Name"
                name="customerName"
                type='text'
                isRequired
                defaultValue={activeCustomerData.customername}
                labelPlacement="inside"
              />
              <Input
                isDisabled={true}
                label="Email"
                name="email"
                type='email'
                isRequired
                defaultValue={activeCustomerData.email}
                labelPlacement="inside"
              />
              <Input
                isDisabled={true}
                label="Mobile"
                name="mobile"
                type='number'
                isRequired
                defaultValue={activeCustomerData.mobile}
                labelPlacement="inside"
              />
              <Select
                isDisabled={checkInDate === '' || checkOutDate === ''}
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
                isDisabled={checkInDate === '' || checkOutDate === ''}
                label={rooms.length > 0 && rooms.some(room => room.propertyid === activePropertyId) ? "Select a Room" : "No rooms available"}
                labelPlacement="inside"
                name="room"
                isRequired
              >
                {rooms.map((room) => room.room_name !== "" && room.room_name !== null && room.propertyid === activePropertyId &&
                  <SelectItem className='text-black' key={room.roomid} value={room.number}>
                    {room.room_name}
                  </SelectItem>
                )}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onPress={onAddClose}>
                Close
              </Button>
              <Button type='submit' color="primary">
                Add
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal placement='center' isOpen={isEditOpen} onOpenChange={OnEditOpenChange}>
        <ModalContent>
          <form onSubmit={editCustomer}>
            <ModalHeader className="flex flex-col gap-1 text-black">Edit Customer</ModalHeader>
            <ModalBody className='text-black overflow-hidden'>
              <Input label="Name" name="name" defaultValue={activeCustomerData.customername} labelPlacement='inside' type='text' />
              <Input label="Email" name='email' defaultValue={activeCustomerData.email} labelPlacement='inside' type='email' />
              <Input label="Mobile" name="mobile" defaultValue={activeCustomerData.mobile} labelPlacement='inside' type='number' />
            </ModalBody>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onPress={onEditClose}>
                Close
              </Button>
              <Button type='submit' color="primary" variant="solid">
                Save
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Customer Modal */}
      <Modal placement='center' isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          <form onSubmit={deleteCustomer}>
            <ModalHeader className="flex flex-col gap-1 text-black">Delete this Customer?</ModalHeader>
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
    </div>
  );
}

export default page;
