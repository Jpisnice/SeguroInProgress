"use client"
import IconXls from '@/assets/js/IconXls';
import apiService from '@/services/apiService';
import { Button, Card, CardFooter, CardHeader, Divider, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from '@nextui-org/react';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr'
import moment from 'moment';
import ExportExcel from '@/components/ExportExcel';
import { nanoid } from 'nanoid';

const columns = [
  { name: "Code String", uid: "barcode" },
  { name: "Property name", uid: "propertyname" },
  { name: "Room Number", uid: "room_name" },
  { name: "Times Opened", uid: "dooropencount" },
];

const customerColumns = [
  { name: "Customer Name", uid: "customername" },
  { name: "Room Number", uid: "room_name" },
  { name: "Property Name", uid: "propertyname" },
  { name: "Last Scan Time", uid: "scandatetime" },
];

const transactionColumns = [
  { name: "Transaction Id", uid: "transactionid" },
  { name: "Property Name", uid: "propertyname" },
  { name: "Invoice No. (from Stripe)", uid: "paytype" },
  { name: "Paid Amount", uid: "amount" },
  { name: "Date", uid: "transaction_datetime" },
  { name: "Invoice", uid: "payment_reference" },
];



const page = () => {

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const fetcher = (args) => (apiService.get(args.api, args.body))
  const { data, mutate, isLoading } = useSWR({
    api: 'vendor/propertiesByUserId/' + Cookies.get("userId"),
  }, fetcher)

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selected, setSelected] = useState('')
  const [activePropertyId, setActivePropertyId] = useState('')
  const [codesMadeReportData, setCodesMadeReportData] = useState([])
  const [customerReportData, setCustomerReportData] = useState([])
  const [transactionReportData, setTransactionReportData] = useState([])
  const [doorOpenedCount, setDoorOpenedCount] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')

  const downloadStripeInvoice = async (subscriptionId) =>{
    const pdfUrl = await apiService.post('vendor/stripesPaymentInvoice',{
      "subscriptionId": subscriptionId
    })
    console.log(pdfUrl)
    if(!pdfUrl.data){
      alert('Failed to download Invoice')
    }else{
      // Open the PDF link in a new tab
      window.open(pdfUrl.data, '_blank');

    }
    }

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case 'checkindatetime':
        return cellValue == null ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case 'scandatetime':
        return cellValue == null ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case 'checkoutdatetime':
        return cellValue == null ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case 'transaction_datetime':
        return cellValue == null ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case 'payment_reference':
        return cellValue == null ? "-" : <Button color='primary' size='sm' onClick={()=>downloadStripeInvoice(cellValue)}>Download</Button>
      default:
        return cellValue;
    }
  }, []);

  const fetchCodesMadeReport = async () => {
    const result = await apiService.post('vendor/reportCodesMade/' + Cookies.get("userId"), {
      "propertyId": activePropertyId,
      "fromDate": fromDate,
      "toDate": toDate
    })
    setCodesMadeReportData(prev => result.data)
  }

  const fetchCustomerReport = async () =>{
    const result = await apiService.post('vendor/reportCustomers/' + Cookies.get("userId"), {
      "propertyId": activePropertyId,
      "fromDate": fromDate,
      "toDate": toDate
    })
    setCustomerReportData(prev => result.data)
  }

  const fetchDoorOpenedCount = async () =>{
    const result = await apiService.post('vendor/doorOpenedCount/' + Cookies.get("userId"), {
      "propertyId": activePropertyId,
      "fromDate": fromDate,
      "toDate": toDate
    })
    setDoorOpenedCount(prev => result.data[0].doorOpenedCount)
  }

  const fetchTransaction = async () =>{
    const result = await apiService.post('vendor/transactionReports/' + Cookies.get("userId"), {
      "fromDate": fromDate,
      "toDate": toDate
    })
    setTransactionReportData(prev => result.data)
    console.log(result)
  }

  useEffect(()=>{
    fetchCodesMadeReport()
    fetchCustomerReport()
    fetchDoorOpenedCount()
    fetchTransaction()
  },[fromDate,toDate,activePropertyId])

  useEffect(() => {
    !isLoading && data.data.length > 0 && fetchCodesMadeReport("")
  }, [data])

  return (
    <>
      <div className='px-4 pt-10 sm:ml-28'>
        <div className='flex flex-col sm:flex-row gap-2 justify-between'>

          <h1 className='text-3xl font-bold'>Reports</h1>

        </div>
        <div className='w-full flex justify-end gap-4 mt-4 flex-col md:flex-row lg:flex-row '>
          <Input
            label="From Date:"
            placeholder=""
            className='justify-around md:justify-start lg:justify-start'
            isClearable
            onValueChange={(val) => setFromDate(val)}
            variant='bordered'
            type='date'
            value={fromDate}
            labelPlacement="outside-left"
          />
          <Input
            label="To Date:"
            placeholder=""
            isClearable
            className='justify-around md:justify-start lg:justify-start'
            onValueChange={(val) => setToDate(val)}
            variant='bordered'
            type='date'
            min={fromDate}
            value={toDate}
            labelPlacement="outside-left"
          />
          {

            !isLoading && <Select
              label="Property"
              labelPlacement='outside-left'
              placeholder="Select Property"
              onSelectionChange={(val) => setActivePropertyId(val.currentKey)}
              className='justify-around md:justify-start lg:justify-start items-center'
              defaultSelectedKeys={[""]}
              variant='bordered'
            >
              <SelectItem key="" value="">
                All Properties
              </SelectItem>
              {data.data.map((property) => (
                <SelectItem key={property.propertyid} value={property.propertyid}>
                  {property.propertyname}
                </SelectItem>
              ))}
            </Select>
          }
        </div>
        {fromDate !== "" && toDate !== "" && <>
        <div className='w-full flex gap-4 mt-4 items-start flex-col lg:flex-row md:flex-row'>
          <Card className="max-w-[400px] min-w-[200px]">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">{codesMadeReportData.length}</p>
                <p className="text-small text-default-500">Codes Dispatched</p>
              </div>
            </CardHeader>
            <Divider />
            <CardFooter>
              <Button color='primary' onClick={() => setSelected('Codes Made')}>View Reports</Button>
            </CardFooter>
          </Card>
          <Card className="max-w-[400px]  min-w-[200px]">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">{customerReportData.length}</p>
                <p className="text-small text-default-500">Customers</p>
              </div>
            </CardHeader>
            <Divider />
            <CardFooter >
              <Button color='primary' onClick={() => setSelected('Customers')}>View Reports</Button>
            </CardFooter>
          </Card>
          <Card className="max-w-[400px]  min-w-[200px]">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">{transactionReportData.length}</p>
                <p className="text-small text-default-500">Payment History</p>
              </div>
            </CardHeader>
            <Divider />
            <CardFooter >
              <Button color='primary' onClick={() => setSelected('Transactions')}>View Reports</Button>
            </CardFooter>
          </Card>
          <Card className="max-w-[400px]  min-w-[200px]">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">{doorOpenedCount}</p>
                <p className="text-small text-default-500">Codes Scanned</p>
              </div>
            </CardHeader>
          </Card>
          {/* <Button onClick={() => setSelected('cardsMade')} color="primary" variant="solid" className='w-100' size='lg' startContent={<span>10</span>}>
            Codes Made
          </Button>
          <Button onClick={() => setSelected('newCustomers')} color="primary" variant="solid" className='w-100' size='lg' startContent={<span>10</span>}>
            New Customers
          </Button>
          <Button onClick={() => setSelected('opens')} color="primary" variant="solid" className='w-100' size='lg' startContent={<span>25</span>}>
            Door Opened
          </Button> */}

        </div>
        {selected !== "" && <>
          <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold'>{selected} <Divider className='ml-2 w-8/12 sm:w-10/12' /></div>
          
          {selected == "Codes Made" ? <Table className='mt-10' aria-label="Example table with custom cells">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={isLoading ? 'Loading...' : 'No Records'} items={codesMadeReportData}>
              {(item) => (
                <TableRow key={nanoid()}>
                  {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>:
          selected == "Transactions" ? <Table className='mt-10' aria-label="Example table with custom cells">
            <TableHeader columns={transactionColumns}>
              {(column) => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={isLoading ? 'Loading...' : 'No Records'} items={transactionReportData}>
              {(item) => (
                <TableRow key={nanoid()}>
                  {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table> :
           <Table className='mt-10' aria-label="Example table with custom cells">
            <TableHeader columns={customerColumns}>
              {(column) => (
                <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={isLoading ? 'Loading...' : 'No Records'} items={customerReportData}>
              {(item) => (
                <TableRow key={nanoid()}>
                  {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
          }
        </>}

        <div className='flex flex-col gap-4 justify-between mt-4 mb-4 sm:flex-row'>
          {/* <ExportExcel data={!isLoading ? data.data : []} columns={columns} /> */}
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

        </>}
      </div>

    </>
  )
}

export default page