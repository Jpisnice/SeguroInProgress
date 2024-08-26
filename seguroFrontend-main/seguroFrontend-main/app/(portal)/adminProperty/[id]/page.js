import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Modal, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure, Switch, Input } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import IconCaretBackOutline from '@/assets/js/IconCaretBackOutline';
import moment from 'moment';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const Page = ({ params }) => {
    const [properties, setProperties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [activeId, setActiveId] = useState('');
    const [graceDays, setGraceDays] = useState(14);
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isDialogOpen, onOpen: onDialogOpen, onOpenChange: onDialogOpenChange, onClose: onDialogClose } = useDisclosure();
    const router = useRouter();

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await axios.get(`/api/properties?userid=${params.id}`);
                setProperties(response.data);
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching properties', error);
            }
        };

        fetchProperties();
    }, [params.id]);

    const showRooms = async (id) => {
        setActiveId(id);
        try {
            const response = await axios.get(`/api/rooms?propertyid=${id}`);
            setRooms(response.data);
            console.log(response.data);
        } catch (error) {
            console.error('Error fetching rooms', error);
        }
        onOpen();
    };

    const toggleIsActive = async (propertyId) => {
        try {
            await axios.post(`/api/toggleVendorProperties/${propertyId}`);
            const response = await axios.get(`/api/properties?userid=${params.id}`);
            setProperties(response.data);
        } catch (error) {
            console.error('Error toggling property status', error);
        }
    };

    const applyGracePeriod = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/applyGracePeriod/${activeId}`, { days: graceDays });
            const response = await axios.get(`/api/properties?userid=${params.id}`);
            setProperties(response.data);
            onDialogClose();
        } catch (error) {
            console.error('Error applying grace period', error);
        }
    };

    const updatePropertyRates = async (propertyId, newRate, newRateEffectiveOn) => {
    try {
        await axios.post(`/api/updatePropertyRates/${propertyId}`, { newRate, newRateEffectiveOn });
        const response = await axios.get(`/api/properties?userid=${params.id}`);
        setProperties(response.data);
    } catch (error) {
        console.error('Error updating property rates', error);
    }
};

    const renderCell = React.useCallback((item, columnKey) => {
        const cellValue = item[columnKey];
        switch (columnKey) {
            case "currentRate":
            case "lastBilledAmount":
            case "currentBillingAmount":
                return cellValue || "-";
            case "newRate":
                return (
                    <Input
                        type="number"
                        value={item.newRate || ''}
                        onChange={(e) => updatePropertyRates(item.propertyid, e.target.value, item.newRateEffectiveOn)}
                    />
                );
            case "newRateEffectiveOn":
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-[180px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {item.newRateEffectiveOn ? format(new Date(item.newRateEffectiveOn), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={item.newRateEffectiveOn ? new Date(item.newRateEffectiveOn) : undefined}
                                onSelect={(date) => updateProperty(item.propertyid, item.newRate, date)}
                            />
                        </PopoverContent>
                    </Popover>
                );
            case "enabledToggle":
                return (
                    <Switch
                        color='primary'
                        onChange={() => toggleIsActive(item.propertyid)}
                        isSelected={item.enabled === "active"}
                    />
                );
            case "numberOfRooms":
                return (
                    <div className="flex gap-2 items-center">
                        <p className="text-bold text-sm capitalize">{cellValue}</p>
                        <Button size='sm' color='primary' onClick={() => showRooms(item.propertyid)}>View</Button>
                    </div>
                );
            default:
                return cellValue || "-";
        }
    }, []);

    return (
        <div>
            <div className='px-4 pt-10 sm:ml-28'>
                <div className='flex justify-start items-center gap-4'>
                    <Button onClick={() => router.back()} color='primary' isIconOnly><IconCaretBackOutline /></Button>
                    <h1 className='text-3xl font-bold'>Property Registered Under {decodeURI(params.id)}</h1>
                </div>

                <Table className='mt-10' aria-label="Property table">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === "enabledToggle" ? "center" : "start"}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={properties}>
                        {(item) => (
                            <TableRow key={item.propertyid}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default Page;
