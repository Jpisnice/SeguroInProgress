import pool from "../../configs/database.js";
import dotenv from 'dotenv'
dotenv.config()
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(dateString)) {
        return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

function currentDateAndTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDate.getDate()).slice(-2);
    const hours = ('0' + currentDate.getHours()).slice(-2);
    const minutes = ('0' + currentDate.getMinutes()).slice(-2);
    const seconds = ('0' + currentDate.getSeconds()).slice(-2);

    const systemTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return systemTime
}

function todaysDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDate.getDate()).slice(-2);

    const systemTime = `${year}-${month}-${day}`;
    return systemTime
}

function yesterdaysDate() {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = ('0' + (yesterday.getMonth() + 1)).slice(-2);
    const day = ('0' + yesterday.getDate()).slice(-2);

    const systemTime = `${year}-${month}-${day}`;
    return systemTime;
}

function getNextDate(dateString) {
    // Create a Date object from the input date string
    let date = new Date(dateString);

    // Increment the date by one day
    date.setDate(date.getDate() + 1);

    // Optionally, format the date to a string (e.g., YYYY-MM-DD)
    let nextDateString = date.toISOString().split('T')[0];
    return nextDateString;
}

// Function to generate a random alphanumeric string of a specified length
const generateRandomAlphaNumeric = (length) => {
    const characters = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
};

// Generate a random unique 7-digit alphanumeric value for the barcode
export const uniqueRandomCode = async () => {
    let randomCode = generateRandomAlphaNumeric(5)
    const [result] = await pool.query("SELECT * FROM codes WHERE barcode = ? AND isdeleted = 0", [randomCode])

    if (result.length == 0) {
        return randomCode
    } else {
        return uniqueRandomCode()
    }
};

export const getProperties = async () => {
    const [rows] = await pool.query(`SELECT * FROM properties WHERE isdeleted = 0 AND isactive = 1 `);

    const result = await Promise.all(rows.map(async row => {
        const property = { ...row };
        let subscription = await pool.query(`SELECT * FROM subscription_plans WHERE planid = ${row.planid} AND isdeleted = 0`)
        property.subscription = subscription[0][0] ?? {}
        return property
    }))
    return result;
};

export const getProperty = async (id) => {
    const [rows] = await pool.query(`
    SELECT * 
    FROM properties
    WHERE propertyid = ? AND isdeleted = 0 AND isactive = 1`, [id]);

    const result = await Promise.all(rows.map(async row => {
        const property = { ...row };
        let subscription = await pool.query(`SELECT * FROM subscription_plans WHERE planid = ${row.planid} AND isdeleted = 0`)
        property.subscription = subscription[0][0] ?? {}
        return property
    }))
    return result[0];
};

export const getPropertyList = async (id) => {
    const [rows] = await pool.query(`
    SELECT propertyid, propertyname 
    FROM properties
    WHERE userid = ? AND isdeleted = 0 AND isactive = 1`, [id]);
    return rows;
};

export const getPropertiesByUserId = async (id) => {
    const [rows] = await pool.query(`
    SELECT * 
    FROM properties
    WHERE userid = ? AND isdeleted = 0 AND isactive = 1`, [id]);

    const result = await Promise.all(rows.map(async row => {
        const property = { ...row };
        let subscription = await pool.query(`SELECT * FROM subscription_plans WHERE planid = ${row.planid} AND isdeleted = 0`)
        property.subscription = subscription[0][0] ?? {}
        return property
    }))
    return result;
};

//updates new rate and new rate effective date
export const updatePropertyRates = async (id, newRate, newRateEffectiveOn) => {
    const query = `
        UPDATE properties
        SET newrate = ?, newrateeffectiveon = ?
        WHERE propertyid = ?`;

    await pool.query(query, [newRate, newRateEffectiveOn, id]);
};


export const deleteProperty = async (id) => {
    const property = await getProperty(id)

    if (!property) {
        return null; // Property not found
    }

    await pool.query(`
    UPDATE properties SET 
    isdeleted = 1
    WHERE propertyid = ?`, [id]);

    return property;
};

export const ugradePropertySubscription = async (id, userId, planId, planType, paymentMethod, paymentReference) => {
    const systemTime = currentDateAndTime();
    if (planType == "M") {
        await pool.query(`UPDATE properties SET 
        planid = ?,
        plantype = ?,
        plan_expiry_date = DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        WHERE propertyid = ?`, [planId, planType, id])

        const result = await pool.query(`SELECT * FROM subscription_plans WHERE planid = ? AND isdeleted = 0`, [planId])

        console.log(result[0][0].monthly_charge)

        const amount = result[0][0].monthly_charge
        await pool.query(`INSERT INTO transactions(
            transaction_datetime, userid, propertyid, planid, amount, paytype, payment_reference)
            VALUES (?,?,?,?,?,?, ?)
            `, [systemTime, userId, id, planId, amount, paymentMethod, paymentReference])

    } else if (planType == "Y") {
        await pool.query(`UPDATE properties SET 
        planid = ?,
        plantype = ?,
        plan_expiry_date = DATE_ADD(CURDATE(), INTERVAL 365 DAY)
        WHERE propertyid = ?`, [planId, planType, id])

        const result = await pool.query(`SELECT * FROM subscription_plans WHERE planid = ? AND isdeleted = 0`, [planId])

        console.log(result[0])

        const amount = result[0][0].yearly_charge
        await pool.query(`INSERT INTO transactions(
            transaction_datetime, userid, propertyid, planid, amount, paytype, payment_reference)
            VALUES (?,?,?,?,?,?, NULL)
            `, [systemTime, userId, id, planId, amount, paymentMethod])
    }
    return await getProperty(id);
}

export const removePropertySubscription = async (propertyId) => {
    try {
        await pool.query(`UPDATE properties SET 
        planid = NULL,
        plantype = NULL,
        plan_expiry_date = DATE_ADD(CURDATE(), INTERVAL 14 DAY)
        WHERE propertyid = ?`, [propertyId])
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

export const updateProperty = async (id, propertyName, address, city, rooms) => {
    // Get the current number of rooms for the property
    const currentRooms = await pool.query(
        'SELECT COUNT(*) as roomCount FROM rooms WHERE propertyid = ? AND isdeleted = 0',
        [id]
    );

    // Calculate the difference in the number of rooms
    const roomDifference = parseInt(rooms) - parseInt(currentRooms[0][0].roomCount);
    console.log({ currentRooms: currentRooms[0][0], roomCount: rooms })

    // let pIpAddress = (propertyIpAddress == "") ? null : propertyIpAddress;
    // let pUDuration = (propertyUnlockDuration == "") ? '15' : propertyUnlockDuration;

    await pool.query(`
    UPDATE properties SET 
    propertyname = ?,
    address1 = ?,
    city = ?,
    number_of_rooms=?
    WHERE propertyid = ?`,
        [propertyName, address, city, rooms, id]
    );

    // If there are more rooms, add the excess rooms to the rooms table
    if (roomDifference > 0) {
        console.log('excess')
        await pool.query(
            'INSERT INTO rooms (propertyid) VALUES '.concat(
                Array.from({ length: roomDifference }, () => `(${id})`).join(',')
            )
        );
    } else if (roomDifference < 0) {
        // If there are fewer rooms, delete the excess rooms from the rooms table
        console.log('less')
        await pool.query(
            'DELETE FROM rooms WHERE propertyid = ? ORDER BY roomid DESC LIMIT ?',
            [id, Math.abs(roomDifference)]
        );
    }

    return await getProperty(id);
};

export const createProperty = async (userId, propertyName, address, city, rooms) => {
    // let pIpAddress = (propertyIpAddress == "") ? null : propertyIpAddress;
    // let pUDuration = (propertyUnlockDuration == "") ? '15' : propertyUnlockDuration;

    const [result] = await pool.query(`
    INSERT INTO properties (userid, propertyname, address1, city, number_of_rooms, plan_expiry_date)
    VALUES (?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
        [userId, propertyName, address, city, rooms]
    );
    const [subscriptions] = await pool.query(`SELECT * FROM subscription_plans WHERE from_rooms_number <= ? and to_rooms_number >= ? LIMIT 1`, [rooms, rooms])

    for (let i = 0; i < subscriptions[0].to_rooms_number; i++) {
        const [roomsResult] = await pool.query(`
    INSERT INTO rooms (propertyid)
    VALUES (?)`,
            [result.insertId]
        );
    }

    // for (const area of areas) {
    //     const [roomsResult] = await pool.query(`INSERT INTO areas (propertyId, areaName, areaIpAddress, areaUnlockDuration) VALUES (?,?,?,?)`, [result.insertId, area.areaName, area.areaIp, area.areaUnlockDuration]);
    // }

    return await getProperty(result.insertId);
};


//Customer list


export const getCustomerList = async () => {
    const [rows] = await pool.query(`SELECT * FROM customers WHERE isdeleted = 0`);

    const result = await Promise.all(rows.map(async row => {
        const customer = { ...row };
        let codes = await pool.query(`SELECT * FROM codes WHERE customerid = ${row.customerid} AND isdeleted = 0`)
        customer.codes = codes[0] ?? []
        return customer
    }))
    return result;
};
export const getCustomerListbyVendorId = async (id) => {
    const [rows] = await pool.query(`SELECT DISTINCT customers.*
    FROM users
    JOIN properties ON properties.userid = users.userid
    JOIN rooms ON rooms.propertyid = properties.propertyid
    JOIN codes ON codes.roomid = rooms.roomid
    JOIN customers ON customers.customerid =codes.customerid
    WHERE users.userid = ? AND properties.isdeleted = 0 AND rooms.isdeleted = 0 AND codes.isdeleted = 0 AND customers.isdeleted = 0`, [id]);

    const result = await Promise.all(rows.map(async row => {
        const customer = { ...row };
        let codes = await pool.query(`SELECT * FROM codes 
        LEFT JOIN rooms ON rooms.roomid = codes.roomid 
        LEFT JOIN properties ON properties.propertyid = rooms.propertyid
        WHERE codes.isdeleted = 0  AND codes.customerid = ${row.customerid} AND properties.userid = ${id} AND rooms.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1;`)
        customer.codes = codes[0] ?? []
        return customer
    }))
    return result;
};

export const getCustomer = async (id) => {
    const [rows] = await pool.query(`
    SELECT * 
    FROM customers
    WHERE customerid = ? AND isdeleted = 0`, [id]);

    const result = await Promise.all(rows.map(async row => {
        const customer = { ...row };
        let codes = await pool.query(`SELECT * FROM codes WHERE customerid = ${row.customerid} AND isdeleted = 0`)
        customer.codes = codes[0] ?? []
        return customer
    }))
    return result[0];
};

export const deleteCustomer = async (id) => {
    const customer = await getCustomer(id)

    if (!customer) {
        return null; // Customer not found
    }

    await pool.query(`UPDATE codes SET isdeleted=1 WHERE customerid=?`, [id]);

    await pool.query(`
    UPDATE customers SET 
    isdeleted = 1
    WHERE customerid = ?`, [id]);

    return customer;
};

export const updateCustomer = async (id, customerName, email, mobile) => {
    await pool.query(`
    UPDATE customers SET 
    customername = ?,
    email = ?,
    mobile = ?
    WHERE customerid = ? `,
        [customerName, email, mobile, id]
    );
    return await getCustomer(id);
};

//Area

export const getAreasByPropertyId = async (id) => {
    if (await getProperty(id) == undefined) {
        return false
    }
    const [result] = await pool.query(`
    SELECT areaId, areaName, areaUnlockDuration, areaIpAddress
    FROM areas
    WHERE propertyId = ? AND isDeleted = 0`, [id]);
    return result;
};

export const saveAreasByPropertyId = async (id, areas = []) => {
    const updateQueries = areas.map(async (room) => {
        const { areaId, areaName, areaIpAddress, areaUnlockDuration } = room;

        if (areaName == '' || areaIpAddress == '') {
            const deleteQuery = `
            DELETE FROM areas
            WHERE areaId = ?;
            `;
            const [result] = await pool.query(deleteQuery, [areaId]);
            return result;
        }
        else {
            const updateQuery = `
            UPDATE areas 
            SET areaName = ?, areaIpAddress = ?, areaUnlockDuration = ?
            WHERE areaId = ? AND propertyId = ? AND isDeleted = 0;
            `;
            const [result] = await pool.query(updateQuery, [areaName, areaIpAddress, areaUnlockDuration, areaId, id]);
            return result;
        }
    });

    // Wait for all update queries to complete
    await Promise.all(updateQueries);
    return areas
}

export const createAreasByPropertyId = async (area) => {
    const { propertyId, areaName, areaIpAddress, areaUnlockDuration } = area;
    const [areaResult] = await pool.query(`INSERT INTO areas (propertyId, areaName, areaIpAddress, areaUnlockDuration) VALUES (?,?,?,?)`, [propertyId, areaName, areaIpAddress, areaUnlockDuration]);
    return areaResult;
}

export const getAreaList = async (id) => {
    const [rows] = await pool.query(`
    SELECT areaId, areaName, areaIpAddress 
    FROM areas
    WHERE propertyId = ? AND isDeleted = 0 AND isActive = 1`, [id]);
    return rows;
};

//Rooms

export const getRoomsByPropertyId = async (id) => {
    if (await getProperty(id) == undefined) {
        return false
    }
    const [result] = await pool.query(`
    SELECT room_name as roomName, roomid as roomId, ip_address as ipAddress, unlock_duration as unlockDuration, password
    FROM rooms
    WHERE propertyid = ? AND isdeleted = 0`, [id]);
    return result;
};

export const getRoomsByUserId = async (id, checkInDate, checkOutDate) => {
    // if (await getUser(id) == undefined) {
    //     return false
    // }
    if (checkInDate == '' || checkOutDate == '') {
        // const [result] = await pool.query(`
        // SELECT DISTINCT rooms.*, properties.*
        // FROM rooms
        // LEFT JOIN properties ON rooms.propertyid = properties.propertyid
        // LEFT JOIN codes ON codes.roomid = rooms.roomid
        // WHERE properties.userid = ?
        //   AND properties.isdeleted = 0 AND properties.isactive = 1 AND codes.isdeleted = 0 AND rooms.isdeleted = 0;`,
        //     [id]
        // );

        const [result] = await pool.query(`
        SELECT DISTINCT rooms.*, properties.*
        FROM rooms
        LEFT JOIN properties ON rooms.propertyid = properties.propertyid
        WHERE properties.userid = ?
          AND properties.isdeleted = 0 AND properties.isactive = 1 AND rooms.isdeleted = 0;`,
            [id]
        );
        return result

    } else {
        const [result] = await pool.query(`SELECT r.*, p.*
        FROM rooms r
        JOIN properties p ON p.propertyid = r.propertyid
        WHERE r.room_name != '' AND r.isdeleted = 0 AND p.isdeleted = 0  AND p.isactive = 1 AND p.userid = ? AND NOT EXISTS
        (
            SELECT * FROM codes c
            WHERE c.roomid = r.roomid AND c.isdeleted = 0 
            AND 
            (
                 STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') BETWEEN c.checkindatetime AND c.checkoutdatetime OR
                 STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') BETWEEN c.checkindatetime AND c.checkoutdatetime OR 
                 (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') <= c.checkindatetime AND STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') >= c.checkoutdatetime)
            )
        );`,
            [id, checkOutDate, checkInDate, checkInDate, checkOutDate]
        );
        return result;

    }
};

export const getRoomDataByUserId = async (id) => {
    const [result] = await pool.query(`SELECT DISTINCT rooms.roomid, rooms.room_name, properties.propertyid, properties.propertyname
    FROM rooms
    LEFT JOIN properties ON rooms.propertyid = properties.propertyid
    WHERE properties.userid = ?
        AND properties.isdeleted = 0 AND properties.isactive = 1 AND rooms.isdeleted = 0 AND rooms.room_name!="" ORDER BY properties.propertyname;`,
        [id]
    );
    return result
};

export const getRoomStatus = async (date, roomId) => {
  const [result] = await pool.query(
    `
        SELECT roomid, codeid, checkindatetime, checkoutdatetime, customerid, barcode 
        FROM codes 
        WHERE 
            isdeleted = 0 
            AND isactive = 1 
            AND roomid = ? 
            AND (
                (checkindatetime <= CONCAT(?, ' 23:59:59') AND checkoutdatetime > CONCAT(?, ' 00:00:01')) 
                OR 
                (checkindatetime > CONCAT(?, ' 23:59:59') AND checkoutdatetime > checkindatetime)
            ) 
        LIMIT 1;
    `,
    [roomId, date, date, date]
  );

  let response = { codeData: [] } ; // Initialize the response object

  if (result.length > 0) {
    const [customerData] = await pool.query(
      `
            SELECT customername, email, mobile 
            FROM customers 
            WHERE isdeleted = 0 AND customerid = ? 
            LIMIT 1;
        `,
      [result[0].customerid]
    );

    const checkInDate = result[0].checkindatetime.toISOString().split("T")[0];
    const checkOutDate = result[0].checkoutdatetime.toISOString().split("T")[0];

    // Determine if the room is yet to be checked into
    const isFutureCheckIn = new Date(checkInDate) > new Date(date);

    const setCheckInDate = isFutureCheckIn
      ? checkInDate
      : checkInDate === date
      ? checkInDate
      : "";
    const setCheckOutDate = checkOutDate === date ? checkOutDate : "";

    let roomStatus;
    if (isFutureCheckIn) {
      roomStatus = 3; // Room is booked but check-in is in the future
    } else {
      const [checkedInData] = await pool.query(
        `
                SELECT code 
                FROM codescanlogs 
                WHERE code = ? AND isfoundvalid = 1 
                LIMIT 1;
            `,
        [result[0].barcode]
      );

      roomStatus = checkedInData.length > 0 ? 1 : 2; // 1: Checked in, 2: Not checked in yet
    }

    response.codeData.push({
      codeId: result[0].codeid,
      roomStatus: roomStatus,
      checkInDate: setCheckInDate,
      checkOutDate: setCheckOutDate,
      customerData: customerData[0],
    });
  } else {
    response.codeData.push({
      roomStatus: 0,
      checkInDate: "",
      checkOutDate: "",
      customerData: "",
    });
  }
  console.log(response);
  return response;
};



export const getCodeData = async (codeId) => {
    const [result] = await pool.query(`SELECT roomid, codeid, checkindatetime, checkoutdatetime, barcode, customerid FROM codes 
    WHERE isdeleted=0 AND isactive=1 AND codeid=? LIMIT 1;`, [codeId]);

    if (result.length > 0) {
        const [customerData] = await pool.query(`SELECT customername, email, mobile FROM customers WHERE isdeleted=0 AND customerid=? LIMIT 1;`, [result[0].customerid]);
        const [roomData] = await pool.query(`SELECT propertyid, ip_address, room_name, unlock_duration, password FROM rooms WHERE isdeleted=0 AND roomid=? LIMIT 1;`, [result[0].roomid]);
        const [propertyData] = await pool.query(`SELECT propertyid, propertyIpAddress, propertyname, propertyUnlockDuration, password FROM properties WHERE isdeleted=0 AND propertyid=? LIMIT 1;`, [roomData[0].propertyid]);
        const [areaData] = await pool.query(`SELECT areaIpAddress, areaUnlockDuration FROM areas WHERE isDeleted=0 AND propertyId=?;`, [roomData[0].propertyid]);

        var data = {
            customername: customerData[0].customername,
            email: customerData[0].email,
            mobile: customerData[0].mobile,
            codeid: result[0].codeid,
            barcode: result[0].barcode,
            checkindatetime: result[0].checkindatetime,
            checkoutdatetime: result[0].checkoutdatetime,
            roomid: result[0].roomid,
            room_name: roomData[0].room_name,
            ip_address: roomData[0].ip_address,
            unlock_duration: roomData[0].unlock_duration,
            propertyname: propertyData[0].propertyname,
            propertyid: roomData[0].propertyid,
            propertyIpAddress: propertyData[0].propertyIpAddress,
            propertyUnlockDuration: propertyData[0].propertyUnlockDuration,
            roomPassword: roomData[0].password,
            propertyPassword: propertyData[0].password,
            areaData: areaData
        }
    }
    else {
        var data = {
            customername: "",
            email: "",
            mobile: "",
            codeid: "",
            barcode: "",
            checkindatetime: "",
            checkoutdatetime: "",
            roomid: "",
            ip_address: "",
            unlock_duration: "",
            propertyid: "",
            propertyIpAddress: "",
            propertyUnlockDuration: "",
            areaData: ""
        }
    }

    return data
};

export const saveRoomsByPropertyId = async (id, rooms = []) => {
    const updateQueries = rooms.map(async (room) => {
        const { roomId, roomName, ipAddress, unlockDuration, password } = room;

        const updateQuery = `
          UPDATE rooms 
          SET room_name = ?, ip_address = ?, unlock_duration = ?, password=?
          WHERE roomid = ? AND propertyid = ? AND isdeleted = 0;
        `;

        const [result] = await pool.query(updateQuery, [roomName, ipAddress, unlockDuration, password, roomId, id]);

        return result;
    });

    // Wait for all update queries to complete
    await Promise.all(updateQueries);
    return rooms
}

//Codes Dashboard

export const getCode = async (id) => {
    const [result] = await pool.query(`
    SELECT * FROM codes 
    JOIN rooms ON rooms.roomid = codes.roomid 
    JOIN properties ON properties.propertyid = rooms.propertyid 
    WHERE codeid = ? AND rooms.isdeleted = 0  AND properties.isdeleted = 0 AND properties.isactive = 1 AND codes.isdeleted = 0`, [id])

    return result[0]
}

export const createNewCode = async (id, customerName, email, mobile, roomId, checkinDate, checkinTime, checkoutDate, checkoutTime) => {
    let customerId;

    const systemTime = currentDateAndTime()

    // Check if customer with the given email or mobile already exists
    const [existingCustomer] = await pool.query(`
        SELECT customerid
        FROM customers
        WHERE email = ? AND customername=? AND isdeleted = 0;
      `, [email, customerName]);

    console.log(existingCustomer);

    if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].customerid;
    } else {
        const [result] = await pool.query(`
      INSERT INTO customers (customerName, email, mobile, datecreated)
      VALUES (?, ?, ?, ?);
    `, [customerName, email, mobile, systemTime]);

        customerId = result.insertId;
    }
    // Insert the code using the obtained customer ID
    const [barcodeData] = await pool.query(`
INSERT INTO codes (barcode, roomId, checkindatetime, checkoutdatetime, customerid)
VALUES (?, ?, STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'), STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'), ?);
`, [await uniqueRandomCode(), roomId, `${checkinDate} ${checkinTime}`, `${checkoutDate} ${checkoutTime}`, customerId]);

    return await getCode(barcodeData.insertId);
}
export const updateCode = async (id, roomId, checkinDate, checkinTime, checkoutDate, checkoutTime) => {
    // console.log({ id, roomId, checkinDate, checkinTime, checkoutDate, checkoutTime })
    const [codeData] = await pool.query(`SELECT customers.customerid,userid FROM codes 
    JOIN customers ON customers.customerid = codes.customerid
    JOIN rooms ON rooms.roomid = codes.roomid
    JOIN properties ON properties.propertyid = rooms.propertyid
    WHERE codeid = ? AND customers.isdeleted = 0 AND rooms.isdeleted = 0 AND codes.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1;`, [id])
    console.log(codeData)
    const [result] = await pool.query(`SELECT * FROM codes c
            WHERE c.roomid = ? AND c.customerid != ? AND c.isdeleted = 0
            AND 
            (
                 STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') BETWEEN c.checkindatetime AND c.checkoutdatetime OR
                 STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') BETWEEN c.checkindatetime AND c.checkoutdatetime OR 
                 (STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') <= c.checkindatetime AND STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') >= c.checkoutdatetime)
            );`,
        [roomId, codeData[0].customerid, `${checkinDate} ${checkinTime}`, `${checkoutDate} ${checkoutTime}`, `${checkinDate} ${checkinTime}`, `${checkoutDate} ${checkoutTime}`]
    );
    console.log(result)
    // Insert the code using the obtained customer ID
    if (result.length == 0) {

        const [barcodeData] = await pool.query(`
            UPDATE codes
            SET
              roomId = ?,
              checkindatetime = STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s'),
              checkoutdatetime = STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')
            WHERE codeid = ?;
        `, [roomId, `${checkinDate} ${checkinTime}`, `${checkoutDate} ${checkoutTime}`, id]);

        return await getCode(id);
    } else {
        return false
    }
}

export const deleteCode = async (id) => {
    const [result] = await pool.query(`DELETE FROM codes WHERE codeid = ?`, [id])

    return result
}

export const getCodesDashboard = async (id) => {
    const currentDateTime = currentDateAndTime()
    const currentDate = todaysDate()
    const yesterday = yesterdaysDate()

    const [alreadyCheckedIn] = await pool.query(`SELECT *
    FROM codes 
    JOIN rooms ON rooms.roomid = codes.roomid 
    JOIN codescanlogs ON codescanlogs.code = codes.barcode 
    JOIN customers ON customers.customerid = codes.customerid 
    JOIN properties ON rooms.propertyid = properties.propertyid 
    WHERE properties.userid = ? AND codes.isdeleted = 0 AND customers.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1
     AND codes.checkindatetime < ?
    AND codes.checkoutdatetime > ? AND codescanlogs.isfoundvalid=1`, [id, currentDateTime, currentDateTime]);

    const [todayCheckIn] = await pool.query(`SELECT *
    FROM codes 
    JOIN rooms ON rooms.roomid = codes.roomid 
    LEFT JOIN codescanlogs ON codescanlogs.code = codes.barcode 
    JOIN customers ON customers.customerid = codes.customerid 
    JOIN properties ON rooms.propertyid = properties.propertyid 
    WHERE properties.userid = ? AND codes.isdeleted = 0 AND customers.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1
    AND codes.checkindatetime < ?
    AND codes.checkoutdatetime > ? AND (codescanlogs.code IS NULL OR codescanlogs.code != codes.barcode)`, [id, currentDateTime, currentDateTime]);

    // const [todayCheckIn] = await pool.query(`SELECT *
    // FROM codes
    // JOIN rooms ON rooms.roomid = codes.roomid
    // LEFT JOIN codescanlogs ON codescanlogs.code = codes.barcode 
    // JOIN customers ON customers.customerid = codes.customerid
    // JOIN properties ON rooms.propertyid = properties.propertyid
    // WHERE properties.userid = ? AND codes.checkindatetime > CONCAT(?, ' 00:00:00') AND codes.isdeleted = 0 AND rooms.isdeleted = 0 AND customers.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1
    // AND codes.checkindatetime < CONCAT(?, ' 23:59:59') AND (codescanlogs.code IS NULL OR codescanlogs.code != codes.barcode)`, [id, currentDate, currentDate]);

    const [upcomingCheckIn] = await pool.query(`SELECT * 
    FROM codes 
    JOIN rooms ON rooms.roomid = codes.roomid 
    JOIN customers ON customers.customerid = codes.customerid 
    JOIN properties ON rooms.propertyid = properties.propertyid 
    WHERE 
      properties.userid = ?  AND codes.isdeleted = 0 AND rooms.isdeleted = 0 AND customers.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1
      AND codes.checkindatetime > ?;`, [id, currentDateTime])

    return {
        "alreadyCheckedIn": alreadyCheckedIn,
        "todayCheckIn": todayCheckIn,
        "upcomingCheckIn": upcomingCheckIn
    };
}

//Report

export const getCodeReportByUserId = async (id, fromDate, toDate, propertyId) => {
    let query = `SELECT 
    codes.*, 
    properties.*, 
    rooms.*, 
    COALESCE(COUNT(DISTINCT codescanlogs.id), 0) AS dooropencount
FROM codes
LEFT JOIN rooms ON codes.roomid = rooms.roomid
LEFT JOIN properties ON properties.propertyid = rooms.propertyid
LEFT JOIN codescanlogs ON codescanlogs.code = codes.codeid AND codescanlogs.isfoundvalid = 1
WHERE properties.userid = ? AND codes.isdeleted = 0 AND rooms.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1
`;

    const params = [id];

    if (isValidDate(fromDate)) {
        query += ' AND checkindatetime >= ?';
        params.push(fromDate);
    }

    if (isValidDate(toDate)) {
        query += ' AND checkindatetime <= ?';
        params.push(toDate);
    }

    if (propertyId != "") {
        query += ' AND properties.propertyid = ?';
        params.push(propertyId);
    }

    query += ' GROUP BY codes.codeid, properties.propertyid, rooms.roomid;';

    const [result] = await pool.query(query, params);

    return result;

}

export const getCustomerReportByUserId = async (id, fromDate, toDate, propertyId) => {
    let query = `WITH RankedResults AS (
        SELECT
            customers.customerid,
            customers.customername,
            properties.propertyid,
            properties.propertyname,
            rooms.roomid,
            rooms.room_name,
            codescanlogs.scandatetime,
            ROW_NUMBER() OVER (PARTITION BY customers.customerid ORDER BY codescanlogs.scandatetime DESC) AS RowNum
        FROM codes
        JOIN customers ON codes.customerid = customers.customerid`;

    const params = [];

    if (isValidDate(fromDate)) {
        query += ' AND createdat >= ?';
        params.push(fromDate);
    }

    if (isValidDate(toDate)) {
        query += ' AND createdat <= ?';
        params.push(toDate);
    }

    query += `
    JOIN rooms ON rooms.roomid = codes.roomid
    JOIN properties ON rooms.propertyid = properties.propertyid`

    if (propertyId != "") {
        query += ' AND properties.propertyid = ?';
        params.push(propertyId);
    }

    query += `
    LEFT JOIN codescanlogs ON codescanlogs.code = codes.codeid AND codescanlogs.isfoundvalid = 1
    WHERE properties.userid = ? AND rooms.isdeleted = 0 AND properties.isdeleted = 0 AND codes.isdeleted = 0 AND properties.isactive = 1
)
SELECT
    customerid,
    customername,
    propertyid,
    propertyname,
    roomid,
    room_name,
    scandatetime
FROM RankedResults
WHERE RowNum = 1;
`
    params.push(id)

    const [result] = await pool.query(query, params);

    return result;

}
export const getDoorOpenedCountByUserId = async (id, fromDate, toDate, propertyId) => {
    let query = `SELECT COUNT(DISTINCT codescanlogs.id) AS doorOpenedCount
    FROM codescanlogs 
    LEFT JOIN codes ON codescanlogs.code = codes.codeid
    LEFT JOIN rooms ON rooms.roomid = codes.roomid 
    LEFT JOIN properties ON rooms.propertyid = properties.propertyid 
    WHERE codescanlogs.isfoundvalid = 1 AND properties.userid = ?  AND rooms.isdeleted = 0 AND properties.isdeleted = 0 AND properties.isactive = 1 AND codes.isdeleted = 0`;

    const params = [id];

    if (isValidDate(fromDate)) {
        query += ' AND scandatetime >= ?';
        params.push(fromDate);
    }

    if (isValidDate(toDate)) {
        query += ' AND scandatetime <= ?';
        params.push(toDate);
    }

    if (propertyId != "") {
        query += ' AND properties.propertyid = ?';
        params.push(propertyId);
    }

    const [result] = await pool.query(query, params);

    return result;

}

export const getTransactionReports = async (id, fromDate, toDate) => {
    let query = `SELECT * FROM transactions
    LEFT JOIN properties ON properties.propertyid = transactions.propertyid AND properties.isdeleted = 0 && properties.isactive = 1
    LEFT JOIN subscription_plans ON transactions.planid = subscription_plans.planid AND subscription_plans.isdeleted = 0
    WHERE transactions.userid = ?`;

    const params = [id];

    if (isValidDate(fromDate)) {
        query += ' AND transaction_datetime >= ?';
        params.push(fromDate);
    }

    if (isValidDate(toDate)) {
        query += ' AND transaction_datetime <= ?';
        params.push(toDate);
    }


    const [result] = await pool.query(query, params);

    return result;

}

export const stripesPaymentIntent = async (amount, paymentType, name, email, paymentMethod, paymentInterval) => {
    try {
        const address = {
            line1: 'Ambury Place',
            city: 'Merrilands',
            postal_code: '4312',
            state: 'New Plymouth',
            country: 'NZ',
        }
        let amountInCents = Math.round(amount * 100);
        // Create a customer
        const customer = await stripe.customers.create({
            email,
            name,
            address,
            payment_method: paymentMethod,
            invoice_settings: { default_payment_method: paymentMethod },
        });
        // Create a product
        const product = await stripe.products.create({
            name: paymentInterval + "ly subscription",
        });
        // Create a subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                {
                    price_data: {
                        currency: paymentType,
                        product: product.id,
                        unit_amount: amountInCents,
                        recurring: {
                            interval: paymentInterval,
                        },
                    },
                },
            ],

            payment_settings: {
                payment_method_types: ["card"],
                save_default_payment_method: "on_subscription",
            },
            expand: ["latest_invoice.payment_intent"],
        });
        // Send back the client secret for payment
        return {
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            data: subscription
        }
    } catch (err) {
        console.log(err)
        return false
    }
}

export const cancelStripesPaymentSubscription = async (userId, propertyId) => {
    try {
        const [transactions] = await pool.query(`SELECT * FROM transactions WHERE userid = ? AND propertyid = ? ORDER BY transactionid DESC`, [userId, propertyId])
        console.log(transactions[0])
        const subscription = await stripe.subscriptions.update(
            transactions[0].payment_reference,
            {
                cancel_at_period_end: true,
            }
        );

        return subscription

    } catch (err) {
        console.log(err)
        return false
    }
}

export const getInvoice = async (subscriptionId) => {
    try {
        // Retrieve the subscription to get the associated customer ID
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Create an invoice for the customer
        const invoice = await stripe.invoices.create({
            customer: subscription.customer,
            subscription: subscriptionId,
        });
        // console.log(invoice)
        // Wait for the invoice to be finalized (contains PDF link)
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

        // // Print or process the finalized invoice
        // console.log("Invoice created:", finalizedInvoice);

        // Get the PDF link from the finalized invoice response
        const pdfLink = finalizedInvoice.invoice_pdf;
        // console.log("PDF Link:", pdfLink);
        return pdfLink

    } catch (err) {
        return false
    }
}


//Settings

export const setDefaultCheckinCheckoutTime = async (id, checkInTime, checkOutTime) => {
    try {
        await pool.query(`UPDATE users SET default_checkin_time= ?, default_checkout_time=? WHERE userid = ?`, [checkInTime, checkOutTime, id])
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// export const getCodes = async (id) => {
//     const currentDateTime = currentDateAndTime()

//     // const [codeData] = await pool.query(`
//     //     SELECT 
//     //         codes.barcode AS qrCode, 
//     //         codes.checkindatetime AS checkInDate, 
//     //         codes.checkoutdatetime AS checkOutDate,
//     //         CONCAT(rooms.ip_address, ', ', GROUP_CONCAT(areas.areaIpAddress SEPARATOR ', ')) AS ipList,
//     //         CONCAT(rooms.unlock_duration, ', ', GROUP_CONCAT(areas.areaUnlockDuration SEPARATOR ', ')) AS unlockTimeList
//     //     FROM codes 
//     //     JOIN rooms ON rooms.roomid = codes.roomid
//     //     JOIN properties ON rooms.propertyid = properties.propertyid 
//     //     JOIN areas ON properties.propertyid = areas.propertyId 
//     //     WHERE properties.userid = ? 
//     //       AND codes.isdeleted = 0 
//     //       AND properties.isdeleted = 0 
//     //       AND properties.isactive = 1
//     //       AND codes.checkindatetime <= ?
//     //       AND codes.checkoutdatetime >= ?
//     //     GROUP BY codes.barcode, codes.checkindatetime, codes.checkoutdatetime
//     // `, [id, currentDateTime, currentDateTime]);

//     const [codeData] = await pool.query(`
//         SELECT 
//             codes.barcode AS qrCode, 
//             codes.checkindatetime AS checkInDate, 
//             codes.checkoutdatetime AS checkOutDate,
//             CONCAT(rooms.ip_address, IFNULL(CONCAT(', ', GROUP_CONCAT(areas.areaIpAddress SEPARATOR ', ')), '')) AS ipList,
//             CONCAT(rooms.unlock_duration, IFNULL(CONCAT(', ', GROUP_CONCAT(areas.areaUnlockDuration SEPARATOR ', ')), '')) AS unlockTimeList
//         FROM codes 
//         JOIN rooms ON rooms.roomid = codes.roomid
//         JOIN properties ON rooms.propertyid = properties.propertyid 
//         LEFT JOIN areas ON properties.propertyid = areas.propertyId 
//         WHERE properties.userid = ? 
//           AND codes.isdeleted = 0 
//           AND properties.isdeleted = 0 
//           AND properties.isactive = 1
//           AND codes.checkindatetime <= ?
//           AND codes.checkoutdatetime >= ?
//         GROUP BY codes.barcode, codes.checkindatetime, codes.checkoutdatetime, rooms.ip_address, rooms.unlock_duration
//     `, [id, currentDateTime, currentDateTime]);

//     return {
//         "codeData": codeData
//     };
// }
export const getCodes = async (id) => {
  try {
    const currentDateTime = currentDateAndTime();
    const tenDaysLater = new Date(
      new Date(currentDateTime).setDate(
        new Date(currentDateTime).getDate() + 10
      )
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // First, fetch all the property IDs associated with the user
    const [properties] = await pool.query(
      `
        SELECT propertyid 
        FROM properties 
        WHERE userid = ? 
          AND isdeleted = 0 
          AND isactive = 1
      `,
      [id]
    );

    const propertyIds = properties.map((prop) => prop.propertyid);

    if (propertyIds.length === 0) {
      return { codeData: [] }; // No properties found for the user
    }

    // Fetch codes that are currently valid
    const [currentCodeData] = await pool.query(
      `
        SELECT 
            codes.barcode AS qrCode, 
            DATE_FORMAT(codes.checkindatetime, '%Y-%m-%d %H:%i:%s') AS checkInDate, 
            DATE_FORMAT(codes.checkoutdatetime, '%Y-%m-%d %H:%i:%s') AS checkOutDate,
            rooms.ip_address AS ipList,
            rooms.unlock_duration AS unlockTimeList
        FROM codes 
        JOIN rooms ON rooms.roomid = codes.roomid
        WHERE rooms.propertyid IN (?) 
          AND codes.isdeleted = 0 
          AND codes.isactive = 1
          AND codes.checkindatetime <= ?
          AND codes.checkoutdatetime >= ?
      `,
      [propertyIds, currentDateTime, currentDateTime]
    );

    // Fetch codes that are yet to be checked in, within the next 10 days
    const [upcomingCodeData] = await pool.query(
      `
        SELECT 
            codes.barcode AS qrCode, 
            DATE_FORMAT(codes.checkindatetime, '%Y-%m-%d %H:%i:%s') AS checkInDate, 
            DATE_FORMAT(codes.checkoutdatetime, '%Y-%m-%d %H:%i:%s') AS checkOutDate,
            rooms.ip_address AS ipList,
            rooms.unlock_duration AS unlockTimeList
        FROM codes 
        JOIN rooms ON rooms.roomid = codes.roomid
        WHERE rooms.propertyid IN (?) 
          AND codes.isdeleted = 0 
          AND codes.isactive = 1
          AND codes.checkindatetime > ?
          AND codes.checkindatetime <= ?
      `,
      [propertyIds, currentDateTime, tenDaysLater]
    );

    // Combine both results and remove duplicates based on qrCode (barcode)
    let codeData = [...currentCodeData, ...upcomingCodeData].filter(
      (code, index, self) =>
        index === self.findIndex((c) => c.qrCode === code.qrCode)
    );

    return { codeData };
  } catch (error) {
    console.error("Error in getCodes function:", error);
    throw error;
  }
};



