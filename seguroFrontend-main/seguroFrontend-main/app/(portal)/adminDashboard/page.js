"use client"
import { Badge, Button, Card, CardBody, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip, User, useDisclosure } from '@nextui-org/react'
import moment from 'moment/moment'
import { useCallback, useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import useSWR from 'swr';
import 'react-calendar/dist/Calendar.css'
import './style.css'
import apiService from '@/services/apiService'
import Loader from '@/components/loader/Loader'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'
import BarGraph from '@/components/BarGraph'
import LineGraph from '@/components/LineGraph'
import IconCalender from '@/assets/js/IconCalender'

const columns = [
    { name: "Name", uid: "fullname" },
    { name: "Business Name", uid: "propertyname" },
    { name: "Current Subscription", uid: "subscription" },
    { name: "Current Expiry", uid: "plan_expiry_date" },
];

const page = () => {
    const fetcher = (args) => (apiService.get(args.api, args.body))
    const { data, error, mutate, isLoading } = useSWR({ api: 'admin/dashboard', body: {} }, fetcher)
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [specialDays, setSpecialDays] = useState([])
    const [value, onChange] = useState(new Date());
    const [activeSubscriptions, setActiveSubscription] = useState([])
    const [showAllTimeActive, setShowAllTimeActive] = useState(false);
    const [showAllTimeDispatched, setShowAllTimeDispatched] = useState(false);
    const [showAllTimeScanned, setShowAllTimeScanned] = useState(false);

    console.log(data);

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const isSpecialDay = specialDays?.some((specialDate) =>
                date.getFullYear() === specialDate.date.year() &&
                date.getMonth() === specialDate.date.month() &&
                date.getDate() === specialDate.date.date()
            );

            return isSpecialDay ? 'special-day text-white' : null;
        }

        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const specialDay = specialDays?.find((specialDate) =>
                date.getFullYear() === specialDate.date.year() &&
                date.getMonth() === specialDate.date.month() &&
                date.getDate() === specialDate.date.date()
            );

            return (
                specialDay && <>
                    <Badge className='-translate-y-6 translate-x-4 border-0 text-[10px]' content={specialDay ? specialDay.count : ""} size='sm' shape="circle" color="danger">
                    </Badge>
                    <Tooltip className='text-black' content={specialDay ? specialDay.info : ""}>
                        <div className="tile-content">
                            {date.getDate()}
                        </div>
                    </Tooltip>

                </>
            );
        }

        return null;
    };

    const renderCell = useCallback((user, columnKey) => {
        const cellValue = user[columnKey];

        switch (columnKey) {
            case "plan_expiry_date":
                return moment(cellValue).format("DD/MM/YYYY hh:mm a")
            case "subscription":
                return user['planid'] == null ? 'trial' : user['plantype'] === 'M' ? 'Monthly (' + user['from_rooms_number'] + '-' + user['to_rooms_number'] + ')' : 'Yearly (' + user['from_rooms_number'] + '-' + user['to_rooms_number'] + ')'
            default:
                return cellValue;
        }
    }, []);

    function updateCodesCreatedOnThisMonth(data) {
        var updatedData = [];
        // Get the current date
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed in JavaScript

        // Initialize a set to store months with codesCreatedOnThisMonth as 1
        const monthsWithCodes1 = new Set();

        // Loop through the data to find months with codesCreatedOnThisMonth as 1
        data?.forEach(item => {
            if (item.codesCreatedOnThisMonth === 1) {
                monthsWithCodes1.add(`${item.created_year}-${item.created_month}`);
            }
        });

        // Update codesCreatedOnThisMonth based on the last 6 months
        for (let i = 1; i < 6; i++) {
            let year = currentYear;
            let month = currentMonth - i;

            if (month <= 0) {
                // Adjust the year and month for the previous year
                year -= 1;
                month += 12;
            }

            const key = `${year}-${month}`;

            // Update codesCreatedOnThisMonth to 0 if the month is not present in monthsWithCodes1
            if (!monthsWithCodes1.has(key)) {
                updatedData.push({
                    "created_year": year,
                    "created_month": month,
                    "codesCreatedOnThisMonth": 0
                });
            }
        }

        return [...data, ...updatedData];
    }

    useEffect(() => {
        if (!isLoading) {
            setActiveSubscription(updateCodesCreatedOnThisMonth(data?.activeSubscriptions))
            data?.renewals.map(expData => {
                setSpecialDays(prev => [...prev, { date: moment(expData.expiry_date), info: expData.plansExpireOnThisDate + ' Renewals', count: expData.plansExpireOnThisDate }])
            })
        }
    }, [data])

    return (
        <>
            <Loader isVisible={isLoading} />
            <div className=''>
                <div className='sm:ml-28 p-4'>
                    <div className='flex flex-row justify-between items-center'>
                        <div>
                            <span className='text-gray-500 font-semibold capitalize'>Hello, {Cookies.get('userName')}!</span>
                            <h1 className='text-3xl font-bold'>Dashboard</h1>
                        </div>
                        <Button size='lg' isIconOnly color="primary" className='rounded-full  text-2xl ' onClick={() => onOpen()}><IconCalender /></Button>
                    </div>
                    <div className='flex lg:flex-row md:flex-col flex-col gap-4'>
                        <div className='lg:w-[49%]'>
                            <div className='mt-2 mb-2 flex gap-2 items-center text-gray-500 font-semibold md:w-[80vw] lg:w-[90vw]'>Renewals this month <Divider className='ml-2 lg:w-4/12 md:w-8/12 w-10/12' /></div>
                            <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg lg:min-h-[300px] md:min-h-[300px]">
                                <div className="overflow-x-auto flex lg:flex-row md:flex-row flex-row m-4">
                                    <div className="flex lg:flex-col md:flex-col flex-col bg-gray-100 text-gray-600 font-bold text-xs rounded-lg m-4">
                                        {columns.map(column =>
                                            <div className="flex-grow p-2 min-w-[100px] bg-gray-100 text-gray-600 font-bold text-xs " key={column.uid}>{column.name}</div>
                                        )}
                                    </div>
                                    {data?.renewalsThisMonth.map((item) => (
                                        <div key={item.id} className="flex lg:flex-col md:flex-col flex-col text-sm m-4">
                                            {columns.map(column =>
                                                <div className="flex-grow p-2  min-w-[100px]" key={nanoid()}>{renderCell(item, column.uid)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className='lg:w-[49%]'>
                            <div className='mt-2 mb-2 text-gray-500 font-semibold md:w-[80vw] lg:w-[90vw] flex justify-start'><p>Renewals next month</p> <Divider className='ml-2 w-4/12 translate-y-3' /></div>
                            <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg lg:min-h-[300px] md:min-h-[300px]">
                                <div className="overflow-x-auto flex flex-row m-4">
                                    <div className="flex flex-col bg-gray-100 text-gray-600 font-bold text-xs rounded-lg m-4">
                                        {columns.map(column =>
                                            <div className="flex-grow p-2 min-w-[100px] bg-gray-100 text-gray-600 font-bold text-xs " key={column.uid}>{column.name}</div>
                                        )}
                                    </div>
                                    {data?.renewalsNextMonth.map((item) => (
                                        <div key={item.id} className="flex flex-col text-sm m-4">
                                            {columns.map(column =>
                                                <div className="flex-grow p-2  min-w-[100px]" key={nanoid()}>{renderCell(item, column.uid)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex lg:flex-row md:flex-col flex-col lg:max-w-screen'>
                        <div className='lg:w-[50%] p-2'>
                            <Button onClick={() => setShowAllTimeActive(!showAllTimeActive)}>
                                {showAllTimeActive ? 'Show Last 5 Months' : 'Show All Time'}
                            </Button>
                            <LineGraph
                                header="Active Subscriptions"
                                data={showAllTimeActive ? data?.activeSubscriptions : activeSubscriptions}
                                color='#ea580c'
                                label='Plans Expire On This Month'
                                valueLabel='codesCreatedOnThisMonth'
                                monthLabel='created_month'
                                yearLabel='created_year'
                                xAxisLabel='Months'
                                yAxisLabel='Subscriptions'
                            />
                        </div>
                        <div className='lg:w-[50%] p-2'>
                            <Button onClick={() => setShowAllTimeDispatched(!showAllTimeDispatched)}>
                                {showAllTimeDispatched ? 'Show Last 5 Months' : 'Show All Time'}
                            </Button>
                            <LineGraph
                                header="Codes Dispatched"
                                data={showAllTimeDispatched ? data?.codesMadeEveryMonth : data?.codesMadeEveryMonth?.slice(-5)}
                                color='#ea580c'
                                label='Codes Dispatched On This Month'
                                valueLabel='codesCreatedOnThisMonth'
                                monthLabel='created_month'
                                yearLabel='created_year'
                                xAxisLabel='Months'
                                yAxisLabel='Codes Count'
                            />
                        </div>
                        <div className='lg:w-[33%] p-2'>
                            <Button onClick={() => setShowAllTimeScanned(!showAllTimeScanned)}>
                                {showAllTimeScanned ? 'Show Last 5 Months' : 'Show All Time'}
                            </Button>
                            <LineGraph
                                header="Codes Scanned"
                                data={showAllTimeScanned ? data?.scanlogsEveryMonth : data?.scanlogsEveryMonth?.slice(-5)}
                                color='#ea580c'
                                label='Codes Scanned On This Month'
                                valueLabel='scansOnThisMonth'
                                monthLabel='log_month'
                                yearLabel='log_year'
                                xAxisLabel='Months'
                                yAxisLabel='Codes Scanned'
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                placement="top-center"
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{moment(value).format('MMMM DD, YYYY')}</ModalHeader>
                            <ModalBody className='p-4 pb-8'>
                                {
                                    !isLoading && <Calendar
                                        className="rounded-lg shadow-gray-500 shadow-lg border-white mx-auto"
                                        value={value}
                                        tileContent={tileContent}
                                        tileClassName={tileClassName}
                                    />
                                }
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}

export default page
