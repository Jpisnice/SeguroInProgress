"use client";
import IconCaretBackOutline from "@/assets/js/IconCaretBackOutline";
import apiService from "@/services/apiService";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@nextui-org/react";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const columns = [
  { name: "Property Name", uid: "Property_Name" },
  { name: "Current Rate", uid: "Current_Rate" },
  { name: "New Rate", uid: "New_Rate" },
  { name: "Number of Rooms", uid: "Number_Of_Rooms" },
  { name: "Occupancy Cap", uid: "Occupancy_Cap" },
  { name: "Last Paid Date", uid: "Last_Paid_Date" },
  { name: "Last Billed Amount", uid: "Last_Billed_Amount" },
  { name: "Next Billing Date", uid: "Next_Billing_Date" },
  { name: "Enabled/Disabled Toggle", uid: "enabledToggle" },
];

const roomsColumns = [
  { name: "Room / Door No.", uid: "room_name" },
  { name: "IP-Address / Device Id", uid: "ip_address" },
  { name: "Last Code Generated", uid: "createdat" },
  { name: "Last Opened", uid: "scandatetime" },
];

const Page = () => {
  const param = useSearchParams();
  const fetcher = (args) => apiService.get(args.api, args.body);
  const [vendorName, setVendorName] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  const [graceDays, setGraceDays] = useState(14);
  const [newRates, setNewRates] = useState({});
  const [occupancyCaps, setOccupancyCaps] = useState({});
  const { data, error, mutate, isLoading } = useSWR(
    { api: "admin/vendorProperties/" + param.get("id"), body: {} },
    fetcher
  );

  const [activeId, setActiveId] = useState("");
  const [activeProperty, setActiveProperty] = useState({});
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isDialogOpen,
    onOpen: onDialogOpen,
    onOpenChange: onDialogOpenChange,
    onClose: onDialogClose,
  } = useDisclosure();
  const router = useRouter();

  useEffect(() => {
    apiService.get("admin/vendor/" + param.get("id")).then((venData) => {
      setVendorName(venData.data.fullname);
    });
  }, [param]);

  const showRooms = (rooms) => {
    setActiveRooms(rooms);
    onOpen();
  };

  const toggleIsActive = async (propertyId) => {
    try {
      await apiService.post("admin/toggleVendorProperties/" + propertyId);
      mutate();
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  const openDialogModal = async (property) => {
    setActiveProperty(property);
    onDialogOpen();
  };

  const handleUpdate = async (propertyId) => {
    try {
      // Ensure newRates and occupancyCaps have valid values
      const payload = {
        propertyid: propertyId,
        newRate:
          newRates[propertyId] !== undefined ? newRates[propertyId] : 30,
        occupancyCap:
          occupancyCaps[propertyId] !== undefined
            ? occupancyCaps[propertyId]
            : false,
      };

      console.log("Updating property:", propertyId, payload);

      await apiService.put(
        `admin/updatePropertyDetails/${propertyId}`,
        payload
      );
      mutate();
    } catch (error) {
      console.error(
        "Error updating property details:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const renderCell = useCallback(
    (item, columnKey) => {
      const cellValue = item[columnKey];
      const propertyId = item.propertyid;

      switch (columnKey) {
        case "Current_Rate":
        case "Last_Billed_Amount":
          return cellValue || "-";
        case "New_Rate":
          return (
            <Input
              type="number"
              value={newRates[propertyId] || ""}
              onChange={(e) => {
                setNewRates((prev) => ({
                  ...prev,
                  [propertyId]: Number(e.target.value),
                }));
              }}
              onBlur={() => handleUpdate(propertyId)}
            />
          );
        case "Occupancy_Cap":
          return (
            <Switch
              checked={occupancyCaps[propertyId] || false}
              onCheckedChange={(checked) => {
                setOccupancyCaps((prev) => ({
                  ...prev,
                  [propertyId]: checked,
                }));
                handleUpdate(propertyId);
              }}
            />
          );
        case "Last_Paid_Date":
        case "Next_Billing_Date":
          return cellValue && cellValue !== "N/A"
            ? moment(cellValue).format("DD/MM/YYYY")
            : "-";
        case "enabledToggle":
          return (
            <Switch
              color="primary"
              onCheckedChange={() => toggleIsActive(propertyId)}
              checked={cellValue === "active"}
            />
          );
        default:
          return cellValue || "-";
      }
    },
    [newRates, occupancyCaps]
  );

  const renderRoomCell = useCallback((item, columnKey) => {
    const cellValue = item[columnKey];
    return cellValue ? moment(cellValue).format("DD/MM/YYYY hh:mm a") : "-";
  }, []);

  const applyGracePeriod = async (e) => {
    e.preventDefault();
    try {
      await apiService.post(
        "admin/applyGracePeriod/" + activeProperty.propertyid,
        {
          days: graceDays,
        }
      );
      mutate();
      onDialogClose();
    } catch (error) {
      console.error(
        "Error applying grace period:",
        error.response ? error.response.data : error.message
      );
    }
  };

  return (
    <div>
      <div className="px-4 pt-10 sm:ml-28">
        <div className="flex justify-start items-center gap-4">
          <Button onClick={() => router.back()} color="primary" isIconOnly>
            <IconCaretBackOutline />
          </Button>
          <h1 className="text-3xl font-bold">
            Property Registered Under {vendorName}
          </h1>
        </div>

        <Table className="mt-10" aria-label="Example table with custom cells">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "enabledToggle" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={!isLoading ? data?.data : []}>
            {(item) => (
              <TableRow key={item.propertyid}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-4 justify-end mt-4 sm:flex-row">
          {/* Pagination component or other UI elements can be added here */}
        </div>
      </div>

      <Modal
        size="2xl"
        placement="center"
        className="w-full"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={(e) => e.preventDefault()}>
              <ModalHeader className="flex flex-col gap-1 text-black">
                Rooms
              </ModalHeader>
              <ModalBody>
                <Table aria-label="Room Details" className="mt-4">
                  <TableHeader columns={roomsColumns}>
                    {(column) => (
                      <TableColumn key={column.uid}>{column.name}</TableColumn>
                    )}
                  </TableHeader>
                  <TableBody items={activeRooms}>
                    {(item) => (
                      <TableRow key={item.room_id}>
                        {(columnKey) => (
                          <TableCell>
                            {renderRoomCell(item, columnKey)}
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        placement="top-center"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={applyGracePeriod}>
              <ModalHeader>Apply Grace Period</ModalHeader>
              <ModalBody>
                <Input
                  value={graceDays}
                  onChange={(e) => setGraceDays(Number(e.target.value))}
                  type="number"
                  min={1}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="primary" type="submit">
                  Apply
                </Button>
                <Button color="primary" variant="flat" onClick={onDialogClose}>
                  Close
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Page;
