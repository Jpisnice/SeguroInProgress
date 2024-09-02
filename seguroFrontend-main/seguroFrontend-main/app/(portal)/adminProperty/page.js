
"use client";
// export default Page;
import IconCaretBackOutline from "@/assets/js/IconCaretBackOutline";
import apiService from "@/services/apiService";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePickerDemo } from "@/components/ui/datepicker"; // Import DatePickerDemo

const columns = [
  { name: "Property Name", uid: "Property_Name" },
  { name: "Current Rate", uid: "Current_Rate" },
  { name: "New Rate", uid: "New_Rate" },
  { name: "New Rate Effective On", uid: "New_Rate_Effective_On" }, // New column
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

export default function Page() {
  const param = useSearchParams();
  const fetcher = (args) => apiService.get(args.api, args.body);
  const [vendorName, setVendorName] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  const [graceDays, setGraceDays] = useState(14);
  const [newRates, setNewRates] = useState({});
  const [occupancyCaps, setOccupancyCaps] = useState({});
  const [newRateEffectiveDates, setNewRateEffectiveDates] = useState({}); // State for new rate effective dates

  const { data, error, mutate, isLoading } = useSWR(
    { api: "admin/vendorProperties/" + param.get("id"), body: {} },
    fetcher
  );

  const [activeProperty, setActiveProperty] = useState({});
  const [isRoomsDialogOpen, setIsRoomsDialogOpen] = useState(false);
  const [isGraceDialogOpen, setIsGraceDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiService.get("admin/vendor/" + param.get("id")).then((venData) => {
      setVendorName(venData.data.fullname);
    });
  }, [param]);

  const showRooms = (rooms) => {
    setActiveRooms(rooms);
    setIsRoomsDialogOpen(true);
  };

  const toggleIsActive = async (propertyId) => {
    try {
      await apiService.post("admin/toggleVendorProperties/" + propertyId);
      mutate();
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  const openGraceDialog = (property) => {
    setActiveProperty(property);
    setIsGraceDialogOpen(true);
  };

  const handleUpdate = async (propertyId) => {
    try {
      const payload = {
        propertyid: propertyId,
        newRate: newRates[propertyId] !== undefined ? newRates[propertyId] : 30,
        occupancyCap:
          occupancyCaps[propertyId] !== undefined
            ? occupancyCaps[propertyId]
            : false,
        newRateEffectiveOn: newRateEffectiveDates[propertyId]
          ? moment(newRateEffectiveDates[propertyId]).format("YYYY-MM-DD")
          : null, // Include effective date
      };

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
            <Input
              type="number"
              value={occupancyCaps[propertyId] || ""}
              onChange={(e) => {
                setOccupancyCaps((prev) => ({
                  ...prev,
                  [propertyId]: Number(e.target.value),
                }));
              }}
              onBlur={() => handleUpdate(propertyId)}
            />
          );
        case "New_Rate_Effective_On":
          return (
            <DatePickerDemo
              selectedDate={newRateEffectiveDates[propertyId]}
              onDateChange={(date) => {
                setNewRateEffectiveDates((prev) => ({
                  ...prev,
                  [propertyId]: date,
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
              checked={cellValue === "active"}
              onCheckedChange={() => toggleIsActive(propertyId)}
            />
          );
        default:
          return cellValue || "-";
      }
    },
    [newRates, occupancyCaps, newRateEffectiveDates]
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
      setIsGraceDialogOpen(false);
    } catch (error) {
      console.error(
        "Error applying grace period:",
        error.response ? error.response.data : error.message
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={() => router.back()} variant="outline" size="icon">
          <IconCaretBackOutline className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          Property Registered Under {vendorName}
        </h1>
      </div>

      <Table>
        <TableHeader>
          {columns.map((column) => (
            <TableHead key={column.uid}>{column.name}</TableHead>
          ))}
        </TableHeader>
        <TableBody>
          {!isLoading &&
            data?.data.map((item) => (
              <TableRow key={item.propertyid}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(item, column.uid)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Dialog open={isRoomsDialogOpen} onOpenChange={setIsRoomsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Rooms</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              {roomsColumns.map((column) => (
                <TableHead key={column.uid}>{column.name}</TableHead>
              ))}
            </TableHeader>
            <TableBody>
              {activeRooms.map((item) => (
                <TableRow key={item.room_id}>
                  {roomsColumns.map((column) => (
                    <TableCell key={column.uid}>
                      {renderRoomCell(item, column.uid)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button onClick={() => setIsRoomsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGraceDialogOpen} onOpenChange={setIsGraceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Grace Period</DialogTitle>
          </DialogHeader>
          <form onSubmit={applyGracePeriod}>
            <div className="grid gap-4 py-4">
              <Input
                value={graceDays}
                onChange={(e) => setGraceDays(Number(e.target.value))}
                type="number"
                min={1}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Apply</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
