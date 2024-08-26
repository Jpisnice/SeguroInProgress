"use client"
import { SelectorIcon } from '@/assets/js/SelectorIcon';
import apiService from '@/services/apiService';
import { Divider, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';

import ExportExcel from '@/components/ExportExcel';
import moment from 'moment';
import { nanoid } from 'nanoid';
import useSWR from 'swr';

const expired = [
  { name: "Name", uid: "fullname" },
  { name: "Property Name", uid: "propertyname" },
  { name: "Mobile", uid: "mobile" },
  { name: "Email", uid: "email" },
  { name: "Expired on", uid: "plan_expiry_date", type: "date" },
];
const revenue = [
  { name: "Date", uid: "date", type: "date" },
  { name: "Transaction Count", uid: "transactions" },
  { name: "Amount", uid: "amount" },
];
const transaction = [
  { name: "Date", uid: "transaction_datetime", type: "date" },
  { name: "Customer Name", uid: "fullname" },
  { name: "Property Name", uid: "propertyname" },
  { name: "Plan Type", uid: "planType" },
  { name: "Amount", uid: "amount" },
];


const page = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportData, setReportData] = useState([])
  const [activeTable, setActiveTable] = useState(expired)
  const [activeTableKey, setActiveTableKey] = useState("expired")
  const fetcher = (args) => (apiService.post(args.api, args.body))
  const { data, error, mutate, isLoading } = useSWR({
    api: 'admin/reports',
    body: {
      "reportType": activeTableKey,
      "fromDate": fromDate,
      "toDate": toDate
    }
  }, fetcher)

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "planType":
        return user['planid'] == null ? "-" : "Monthly (" + user['from_rooms_number'] + " - " + user['to_rooms_number'] + ")"
      case "datecreated":
        return cellValue == null || cellValue == "" ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case "transaction_datetime":
        return cellValue == null || cellValue == "" ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case "date":
        return cellValue == null || cellValue == "" ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      case "plan_expiry_date":
        return cellValue == null || cellValue == "" ? "-" : moment(cellValue).format("DD/MM/YYYY hh:mm a")
      default:
        return cellValue;
    }
  }, []);

  useEffect(() => {
    switch (activeTableKey) {
      case "expired":
        setActiveTable(expired);
        break;
      case "revenue":
        setActiveTable(revenue);
        break;
      case "transaction":
        setActiveTable(transaction);
        break;
      default:
    }
  }, [activeTableKey])

  useEffect(() => {
    if (!isLoading) {
      setReportData(data.data)
      activeTableKey == "revenue" ? setReportData(prev => [...prev, {
        date: '',
        transactions: !isLoading && "Total: " + data.data.reduce((acc, user) => acc + parseInt(user.transactions), 0),
        amount: !isLoading && "Total: " + data.data.reduce((acc, user) => acc + parseInt(user.amount), 0)
      }]) : activeTableKey == "transaction" && setReportData(prev => [...prev, {
        transaction_datetime: '',
        fullname: '',
        propertyname: '',
        plantype: '',
        amount: !isLoading && "Total: " + data.data.reduce((acc, user) => acc + parseInt(user.amount), 0)
      }])
    }
  }, [data])


  useEffect(() => {
    mutate()
    console.log(toDate)
  }, [setActiveTableKey, toDate, fromDate])

  return (
    <>
      <div className='px-4 pt-10 sm:ml-28'>
        <div className='flex flex-col sm:flex-row gap-2 justify-between'>

          <h1 className='text-3xl font-bold'>Reports</h1>

        </div>
        <div className='mt-10 mb-2 flex gap-2 items-center text-gray-500 font-semibold'>Report Type <Divider className='ml-2 w-8/12 sm:w-10/12' /></div>
        <div className="flex flex-col sm:flex-row gap-2 justify-between mt-4">
          <Select
            aria-label='reportType'
            placeholder="Select Report Type"
            onSelectionChange={(val) => {
              setToDate('')
              setFromDate('')
              setActiveTableKey(val.currentKey)
            }}
            className="max-w-xs"
            variant='bordered'
            disableSelectorIconRotation
            defaultSelectedKeys={[activeTableKey]}
            classNames={"text-black"}
            selectorIcon={<SelectorIcon />}
          >
            <SelectItem className='text-black' value={"expired"} key={"expired"}>
              Expired not Renewed
            </SelectItem>
            <SelectItem className='text-black' value={"revenue"} key={"revenue"}>
              Revenue by Date
            </SelectItem>
            <SelectItem className='text-black' value={"transaction"} key={"transaction"}>
              Payment Transaction
            </SelectItem>
          </Select>
          {/* <Button size='lg' color="primary" variant={activeTable == expired ? "flat" : "solid"} disabled={activeTable == expired} onClick={() => setActiveTable(expired)}>
            Expired Date
          </Button>
          <Button size='lg' color="primary" variant={activeTable == revenue ? "flat" : "solid"} disabled={activeTable == revenue && true} onClick={() => setActiveTable(revenue)}>
            Revenue by Date
          </Button>
          <Button size='lg' color="primary" variant={activeTable == transaction ? "flat" : "solid"} disabled={activeTable == transaction && true} onClick={() => setActiveTable(transaction)}>
            Payment Transaction
          </Button> */}
        </div>
        <div className='w-full flex justify-start gap-4 mt-4'>
          {activeTable !== expired && <>
            <Input
              variant='bordered'
              label="From Date:"
              placeholder=""
              value={fromDate}
              onValueChange={(val) => setFromDate(val)}
              type='date'
              isClearable
              labelPlacement="outside-left"
            />
            <Input
              variant='bordered'
              label="To Date:"
              placeholder=""
              type='date'
              min={fromDate}
              isClearable
              value={toDate}
              onValueChange={(val) => setToDate(val)}
              labelPlacement="outside-left"
            /></>}
        </div>

        <Table className='mt-4' aria-label="Example table with custom cells">
          <TableHeader columns={activeTable}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={isLoading ? "Loading..." : "No Reports found"} items={!isLoading ? reportData : []}>
            {(item) => {

              return (
                <TableRow key={nanoid()}>
                  {(columnKey) => { // Add this console log
                    return <TableCell>{renderCell(item, columnKey)}</TableCell>;
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
        <div className='flex flex-col gap-4 justify-start mt-4 sm:flex-row'>
          <ExportExcel
            data={!isLoading ? reportData : []}
            columns={activeTable}
            footerCells={[]} />
          {/* <Button className='min-w-fit' variant='bordered' onClick={() => xls.exportToXLS('export.xls')} color='primary' endContent={<IconXls />}>Download</Button> */}
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

    </>
  )
}

export default page