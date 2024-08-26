"use client";
import { useState, useEffect } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure } from "@nextui-org/react";
import apiService from "@/services/apiService";
import useSWR from "swr";
import Cookies from "js-cookie";
import moment from "moment";

const columns = [
  { name: "Bill Date", uid: "billDate" },
  { name: "Amount Due", uid: "amountDue" },
  { name: "Overdue Balance", uid: "overdueBalance" },
  { name: "Invoices", uid: "invoices" },
];

const page = () => {
  const fetcher = (args) => apiService.get(args.api, args.body);
  const { data, mutate, isLoading } = useSWR({ api: "vendor/billings/" + Cookies.get("userId"), body: {} }, fetcher);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [activeBillingData, setActiveBillingData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredBillings, setFilteredBillings] = useState([]);

  const fetchBillings = async () => {
    const response = await apiService.get("vendor/billings/" + Cookies.get("userId"));
    setActiveBillingData(response.data);
  };

  useEffect(() => {
    if (!isLoading) {
      setFilteredBillings(data.data);
      fetchBillings();
    }
  }, [data]);

  useEffect(() => {
    setFilteredBillings(prev => prev = data?.data?.filter(bill => bill.billDate.toLowerCase().includes(searchText.toLowerCase())));
  }, [searchText]);

  const renderCell = (billing, columnKey) => {
    const cellValue = billing[columnKey];

    switch (columnKey) {
      case "invoices":
        return (
          <Button onClick={() => onOpen()} color="primary">
            View Invoices
          </Button>
        );
      default:
        return cellValue;
    }
  };

  return (
    <>
      <div className="px-4 pt-10">
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <h1 className="text-3xl font-bold">Billings</h1>
          <Input
            className="max-w-[400px]"
            onValueChange={(val) => setSearchText(val)}
            placeholder="search"
            variant="bordered"
          />
        </div>

        <Table className="mt-10" aria-label="Billing table">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={filteredBillings ?? []}>
            {(item) => (
              <TableRow key={item.billId}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal placement="center" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-black">Billing Invoices</ModalHeader>
          <ModalBody className="text-black">
            {/* Replace with your invoice details */}
            <p>Invoice details will be shown here.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default page;
