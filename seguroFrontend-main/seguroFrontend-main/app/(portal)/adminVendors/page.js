"use client"
import { DeleteIcon } from '@/assets/js/DeleteIcon';
import { EditIcon } from '@/assets/js/EditIcon';
import { EyeFilledIcon } from '@/assets/js/EyeFilledIcon';
import { EyeIcon } from '@/assets/js/EyeIcon';
import { EyeSlashFilledIcon } from '@/assets/js/EyeSlashFilledIcon';
import apiService from '@/services/apiService';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from '@nextui-org/react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';


const columns = [
  { name: "Name", uid: "fullname" },
  { name: "Business Name", uid: "businessname" },
  { name: "Email", uid: "email" },
  { name: "Property Count", uid: "propertycount" },
  { name: "Actions", uid: "actions" },
  { name: "Enabled", uid: "isactive" },
];

var users = [
  {
    id: 1,
    name: "Tony Reichert",
    propertyName: "Bit Tech",
    propertyCount: "2",
    mobile: "9876543210",
    email: "tony.reichert@example.com",
  },
  {
    id: 2,
    name: "Zoey Lang",
    propertyName: "Techify",
    propertyCount: "5",
    mobile: "9876543210",
    email: "zoey.lang@example.com",
  },
  {
    id: 3,
    name: "Jane Fisher",
    propertyName: "Metro Tech",
    propertyCount: "3",
    mobile: "9876543210",
    email: "jane.fisher@example.com",
  },
  {
    id: 4,
    name: "William Howard",
    propertyName: "Techzoid",
    propertyCount: "6",
    mobile: "9876543210",
    email: "william.howard@example.com",
  },
  {
    id: 5,
    name: "Kristen Copper",
    propertyName: "Nixon",
    propertyCount: "5",
    mobile: "9876543210",
    email: "kristen.cooper@example.com",
  },
  {
    id: 6,
    name: "Olive Yew",
    propertyName: "Noob Tech",
    propertyCount: "8",
    mobile: "9876543210",
    email: "olive.yew@example.com",
  },
  {
    id: 7,
    name: "Abigail Paul",
    propertyName: "Drift Tech",
    propertyCount: "7",
    mobile: "9876543210",
    email: "abigail.paul@example.com",
  },
  {
    id: 8,
    name: "Peg Legge",
    propertyName: "Power Tech",
    propertyCount: "3",
    mobile: "9876543210",
    email: "peg.legge@example.com",
  },
  {
    id: 9,
    name: "Henna Baker",
    propertyName: "Omega",
    propertyCount: "9",
    mobile: "9876543210",
    email: "henna.baker@example.com",
  },
  {
    id: 10,
    name: "Clark Davidson",
    propertyName: "Connect",
    propertyCount: "7",
    mobile: "9876543210",
    email: "clark.davidson@example.com",
  },
];

const page = () => {

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenEditChange, onClose: onCloseEdit } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenDeleteChange, onClose: onCloseDelete } = useDisclosure()
  const [activeData, setActiveData] = useState({})
  const [isVisible, setIsVisible] = React.useState(false);
  const [activeCode, setActiveCode] = useState({})
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const fetcher = (args) => (apiService.get(args.api, args.body))
  const { data, error, mutate, isLoading } = useSWR({ api: 'admin/vendor', body: {} }, fetcher)

  const toggleVisibility = () => setIsVisible(!isVisible);

  const toggleIsActive = async (userId, index) => {
    await apiService.post('admin/toggleVendorStatus/' + userId)
    mutate()
  }

  const fetchEmailTemplate = async () => {
    const result = await apiService.post('emailTemplate', {
      'type': 'new_vendor',
      'id': '21'
    })

    setSubject(result.data.subject)
    setBody(result.data.body)
    console.log(result)
  }

  const openEditModal = async (userData) => {
    console.log("ddd")
    setActiveData(userData)
    onOpenEdit()
  }
  const openDeleteModal = async (userData) => {
    setActiveData(userData)
    onOpenDelete()
  }

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "propertycount":
        return (
          <div className="flex gap-2">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
            <Link href={'adminProperty?id=' + user["userid"]} className='text-orange-600 underline'>View</Link>
          </div>
        );
      case "isactive":
        return (
          <Switch onValueChange={(val) => toggleIsActive(user.userid)} color='primary' isSelected={user.isactive == "1" ? true : false} />
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2 text-orange-600 text-black">
            {/* <Tooltip className='text-black' content="Details">
              <span className="text-lg  text-orange-600 cursor-pointer active:opacity-50">
                <EyeIcon />
              </span>
            </Tooltip> */}
            <Tooltip className='text-black' content="Edit user">
              <span onClick={() => openEditModal(user)} className="text-lg  text-orange-600 cursor-pointer active:opacity-50">
                <EditIcon />
              </span>
            </Tooltip>
            <Tooltip className='text-black' content="Delete">
              <span onClick={() => openDeleteModal(user)} className="text-lg text-orange-600 cursor-pointer active:opacity-50">
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  function replacePlaceholders(template, replacements) {
    return template.replace(/\[(.*?)\]/g, (match, p1) => {
      // Use p1 to access the placeholder without brackets
      return replacements[p1] || match;
    });
  }



  const addNewVendor = async (e) => {
    e.preventDefault()

    const vendorName = e.target['name'].value;
    const vendorEmail = e.target['email'].value;
    const vendorPassword = e.target['password'].value;

    const replacements = {
      vendor_name: vendorName,
      vendor_email: vendorEmail,
      vendor_password: vendorPassword,
      admin_name: Cookies.get('userName'),
    };
    try {
      setActiveCode({
        'vendorName': e.target['name'].value,
        'vendorEmail': e.target['email'].value,
        'vendorPassword': e.target['password'].value,
        'adminName': Cookies.get('userName')
      })

      await apiService.post('admin/vendor', {
        "name": vendorName,
        "businessName": e.target['businessName'].value,
        "email": vendorEmail,
        "mobile": e.target['mobile'].value,
        "password": vendorPassword,
      });

      await apiService.post('sendEmail', {
        "email": vendorEmail,
        "subject": replacePlaceholders(subject, replacements),
        "body": replacePlaceholders(body, replacements),
      });

      mutate();
      alert("Vendor Created Successfully");
      onClose();
    } catch (err) {
      alert((err.response.data.data && err.response.data.data.errors[0].msg) ?? err.response.data.message)
    }

  }
  const editVendor = async (e) => {
    e.preventDefault()

    await apiService.put('admin/vendor/' + activeData.userid, {
      "name": e.target['name'].value,
      "businessName": e.target['businessName'].value,
      "email": e.target['email'].value,
      "mobile": e.target['mobile'].value
    }).then(() => onCloseEdit()).catch(({ response }) => alert((response.data.data && response.data.data.errors[0].msg) ?? response.data.message))
    mutate()
  }

  const deleteVendor = async (e) => {
    e.preventDefault()

    await apiService.drop('admin/vendor/' + activeData.userid).then(() => onCloseDelete()).catch(({ response }) => alert(response.data.message))
    mutate()
  }

  useEffect(() => {
    fetchEmailTemplate()
  }, [])



  return (
    <div>
      <div className='px-4 pt-10 sm:ml-28'>
        <div className='flex flex-col sm:flex-row gap-2 justify-between'>

          <h1 className='text-3xl font-bold'>Vendors</h1>
          <Button onClick={() => onOpen()} className='bg-slate-800 text-white font-bold'>
            + Create New Vendor
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
          <TableBody items={!isLoading ? data : []}>

            {(item) => (
              <TableRow key={item.userid}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className='flex  justify-end mt-4'>

          {/* <div className='flex flex-col sm:flex-row gap-2 items-center'>
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

      {/* create */}
      <Modal placement='center' isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <form onSubmit={addNewVendor}>
            <ModalHeader className="flex flex-col gap-1 text-black">Add Vendor</ModalHeader>
            <ModalBody className='text-black'>
              <Input
                isRequired
                label="Name"
                name="name"
                type='text'
                labelPlacement="inside"
              />
              <Input
                isRequired
                label="Business Name"
                name="businessName"
                type='text'
                labelPlacement="inside"
              />

              <Input
                isRequired
                label="Email"
                name="email"
                type='text'
                labelPlacement="inside"
              />
              <Input
                isRequired
                label="Mobile"
                name="mobile"
                type='number'
                labelPlacement="inside"
              />
              <Input
                isRequired
                label="Password"
                name="password"
                type={isVisible ? 'text' : 'password'}
                endContent={
                  <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                    {isVisible ? (
                      <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
                labelPlacement="inside"
              />
            </ModalBody>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onClick={() => onClose()}>
                Close
              </Button>
              <Button type='submit' color="primary">
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      {/* edit  */}
      <Modal placement='center' isOpen={isOpenEdit} onOpenChange={onOpenEditChange}>
        <ModalContent>
          <form onSubmit={editVendor}>
            <ModalHeader className="flex flex-col gap-1 text-black">Edit Vendor</ModalHeader>
            <ModalBody className='text-black'>
              <Input
                label="Name"
                defaultValue={activeData.fullname}
                name="name"
                type='text'
                labelPlacement="inside"
              />
              <Input
                label="Business Name"
                defaultValue={activeData.businessname}
                name="businessName"
                type='text'
                labelPlacement="inside"
              />

              <Input
                label="Email"
                defaultValue={activeData.email}
                name="email"
                type='text'
                labelPlacement="inside"
              />
              <Input
                label="Mobile"
                defaultValue={activeData.mobile}
                name="mobile"
                type='number'
                labelPlacement="inside"
              />
            </ModalBody>
            <ModalFooter>
              <Button type='button' color="danger" variant="light" onClick={() => onCloseEdit()}>
                Close
              </Button>
              <Button type='submit' color="primary">
                Save
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      {/* delete  */}
      <Modal placement='center' isOpen={isOpenDelete} onOpenChange={onOpenDeleteChange}>
        <ModalContent>

          <form onSubmit={deleteVendor}>

            <ModalHeader className="flex flex-col gap-1 text-black">Delete this Vendor?</ModalHeader>
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
    </div>
  )
}

export default page