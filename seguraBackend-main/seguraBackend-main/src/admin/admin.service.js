import pool from "../../configs/database.js";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import { getProperty } from "../vendor/vendor.service.js";

function sha256(input) {
  const hash = crypto.createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

function hashPassword(password) {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

function comparePasswords(plainPassword, hashedPassword) {
  const hashedInputPassword = hashPassword(plainPassword);
  return hashedInputPassword === hashedPassword;
}

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
  const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  const day = ("0" + currentDate.getDate()).slice(-2);
  const hours = ("0" + currentDate.getHours()).slice(-2);
  const minutes = ("0" + currentDate.getMinutes()).slice(-2);
  const seconds = ("0" + currentDate.getSeconds()).slice(-2);

  const systemTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return systemTime;
}

export const getAdminDashboard = async () => {
  const currentDate = currentDateAndTime();
  const [earnings] = await pool.query(`
        SELECT 
            SUM(CASE WHEN MONTH(transaction_datetime) = MONTH(CURRENT_DATE()) AND YEAR(transaction_datetime) = YEAR(CURRENT_DATE()) THEN amount ELSE 0 END) AS transactionThisMonth,
            SUM(CASE WHEN YEAR(transaction_datetime) = YEAR(CURRENT_DATE()) THEN amount ELSE 0 END) AS transactionThisYear
        FROM transactions;
    `);

  const [codes] = await pool.query(
    `SELECT COUNT(*) as codesCount FROM codes WHERE isdeleted = 0;`
  );
  const [opens] = await pool.query(
    `SELECT COUNT(*) as scanCount FROM codescanlogs WHERE isfoundvalid = 1;`
  );

  const [renewals] = await pool.query(
    `
        SELECT COUNT(*) AS plansExpireThisMonth 
        FROM properties 
        WHERE MONTH(plan_expiry_date) = MONTH(?) 
        AND YEAR(plan_expiry_date) = YEAR(?) 
        AND isdeleted = 0 
        AND isactive = 1;`,
    [currentDate, currentDate]
  );

  const [allRenewals] = await pool.query(`
        SELECT plan_expiry_date AS expiry_date, COUNT(*) AS plansExpireOnThisDate
        FROM properties
        WHERE isdeleted = 0 AND isactive = 1
        GROUP BY DATE(plan_expiry_date)
        ORDER BY expiry_date;
    `);

  const [renewalsThisMonth] = await pool.query(`
        SELECT * FROM properties 
        LEFT JOIN users ON users.userid = properties.userid AND users.isdeleted = 0 AND users.isactive = 1
        LEFT JOIN subscription_plans ON properties.planid = subscription_plans.planid AND subscription_plans.isdeleted = 0
        WHERE properties.isdeleted = 0 
        AND properties.isactive = 1 
        AND EXTRACT(MONTH FROM plan_expiry_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
        AND EXTRACT(YEAR FROM plan_expiry_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    `);

  const [renewalsNextMonth] = await pool.query(`
        SELECT * FROM properties 
        LEFT JOIN users ON users.userid = properties.userid AND users.isdeleted = 0 AND users.isactive = 1
        LEFT JOIN subscription_plans ON properties.planid = subscription_plans.planid AND subscription_plans.isdeleted = 0
        WHERE properties.isdeleted = 0 
        AND properties.isactive = 1 
        AND plan_expiry_date >= DATE_FORMAT(NOW(), '%Y-%m-01') + INTERVAL 1 MONTH
        AND plan_expiry_date < DATE_FORMAT(NOW(), '%Y-%m-01') + INTERVAL 2 MONTH;
    `);

  const [vendors] = await pool.query(
    `SELECT COUNT(*) AS vendorCount FROM users WHERE usertype = 'V' AND isactive = 1 AND isdeleted=0;`
  );

  const [renewalsEveryMonth] = await pool.query(`
        WITH RECURSIVE month_series AS (
            SELECT EXTRACT(YEAR FROM CURRENT_DATE) AS year, EXTRACT(MONTH FROM CURRENT_DATE) AS month
            UNION ALL
            SELECT CASE WHEN month = 1 THEN year - 1 ELSE year END, CASE WHEN month = 1 THEN 12 ELSE month - 1 END
            FROM month_series
            WHERE year > EXTRACT(YEAR FROM CURRENT_DATE) - 1
        )
        SELECT COALESCE(month_series.year, EXTRACT(YEAR FROM CURRENT_DATE)) AS expiry_year, COALESCE(month_series.month, EXTRACT(MONTH FROM CURRENT_DATE)) AS expiry_month,
        COUNT(CASE WHEN properties.plan_expiry_date < CURRENT_DATE THEN 1 ELSE NULL END) AS plansExpireOnThisMonth
        FROM month_series
        LEFT JOIN properties ON isdeleted = 0 AND isactive = 1 AND EXTRACT(YEAR FROM plan_expiry_date) = COALESCE(month_series.year, EXTRACT(YEAR FROM CURRENT_DATE))
        AND EXTRACT(MONTH FROM plan_expiry_date) = COALESCE(month_series.month, EXTRACT(MONTH FROM CURRENT_DATE))
        GROUP BY expiry_year, expiry_month
        ORDER BY expiry_year DESC, expiry_month DESC LIMIT 6;
    `);

  const [scanlogsEveryMonth] = await pool.query(`
        WITH RECURSIVE month_series AS (
            SELECT EXTRACT(YEAR FROM CURRENT_DATE) AS year, EXTRACT(MONTH FROM CURRENT_DATE) AS month
            UNION ALL
            SELECT CASE WHEN month = 1 THEN year - 1 ELSE year END, CASE WHEN month = 1 THEN 12 ELSE month - 1 END
            FROM month_series
            WHERE year > EXTRACT(YEAR FROM CURRENT_DATE) - 1
        )
        SELECT COALESCE(month_series.year, EXTRACT(YEAR FROM CURRENT_DATE)) AS log_year, COALESCE(month_series.month, EXTRACT(MONTH FROM CURRENT_DATE)) AS log_month,
        COUNT(CASE WHEN codescanlogs.scandatetime < CURRENT_DATE THEN 1 ELSE NULL END) AS scansOnThisMonth
        FROM month_series
        LEFT JOIN codescanlogs ON EXTRACT(YEAR FROM codescanlogs.scandatetime) = COALESCE(month_series.year, EXTRACT(YEAR FROM CURRENT_DATE))
        AND EXTRACT(MONTH FROM codescanlogs.scandatetime) = COALESCE(month_series.month, EXTRACT(MONTH FROM CURRENT_DATE))
        GROUP BY log_year, log_month
        ORDER BY log_year DESC, log_month DESC LIMIT 6;
    `);

  const [codesMadeEveryMonth] = await pool.query(`
        WITH RECURSIVE month_series AS (
            SELECT YEAR(CURRENT_DATE) AS year, MONTH(CURRENT_DATE) AS month
            UNION ALL
            SELECT CASE WHEN month = 1 THEN year - 1 ELSE year END, CASE WHEN month = 1 THEN 12 ELSE month - 1 END
            FROM month_series
            WHERE year > YEAR(CURRENT_DATE) - 1
        )
        SELECT COALESCE(month_series.year, YEAR(CURRENT_DATE)) AS created_year, COALESCE(month_series.month, MONTH(CURRENT_DATE)) AS created_month,
        COUNT(CASE WHEN codes.createdat >= COALESCE(STR_TO_DATE(CONCAT(month_series.year, '-', month_series.month, '-01'), '%Y-%m-%d'), CURRENT_DATE)
        AND codes.createdat < COALESCE(STR_TO_DATE(CONCAT(month_series.year, '-', month_series.month + 1, '-01'), '%Y-%m-%d'), CURRENT_DATE) THEN 1 ELSE NULL END) AS codesCreatedOnThisMonth
        FROM month_series
        LEFT JOIN codes ON YEAR(codes.createdat) = COALESCE(month_series.year, YEAR(CURRENT_DATE))
        AND MONTH(codes.createdat) = COALESCE(month_series.month, MONTH(CURRENT_DATE))
        GROUP BY created_year, created_month
        ORDER BY created_year DESC, created_month DESC LIMIT 6;
    `);

  const [transacts] = await pool.query(`
        WITH RECURSIVE month_series AS (
            SELECT YEAR(CURRENT_DATE) AS year, MONTH(CURRENT_DATE) AS month
            UNION ALL
            SELECT CASE WHEN month = 1 THEN year - 1 ELSE year END, CASE WHEN month = 1 THEN 12 ELSE month - 1 END
            FROM month_series
            WHERE year > YEAR(CURRENT_DATE) - 1
        )
        SELECT COALESCE(month_series.year, YEAR(CURRENT_DATE)) AS created_year, COALESCE(month_series.month, MONTH(CURRENT_DATE)) AS created_month,
        COUNT(CASE WHEN transactions.transaction_datetime >= COALESCE(STR_TO_DATE(CONCAT(month_series.year, '-', month_series.month, '-01'), '%Y-%m-%d'), CURRENT_DATE)
        AND transactions.transaction_datetime < COALESCE(STR_TO_DATE(CONCAT(month_series.year, '-', month_series.month + 1, '-01'), '%Y-%m-%d'), CURRENT_DATE) THEN 1 ELSE NULL END) AS transactionsCreatedOnThisMonth
        FROM month_series
        LEFT JOIN transactions ON YEAR(transactions.transaction_datetime) = COALESCE(month_series.year, YEAR(CURRENT_DATE))
        AND MONTH(transactions.transaction_datetime) = COALESCE(month_series.month, MONTH(CURRENT_DATE))
        JOIN properties ON properties.propertyid = transactions.propertyid AND properties.planid IS NOT NULL
        GROUP BY created_year, created_month
        ORDER BY created_year, created_month;
    `);

  const [allScanlogs] = await pool.query(`
        SELECT YEAR(scandatetime) AS log_year, MONTH(scandatetime) AS log_month, COUNT(*) AS scansOnThisMonth
        FROM codescanlogs
        GROUP BY log_year, log_month
        ORDER BY log_year DESC, log_month DESC;
    `);

  const [allCodesMade] = await pool.query(`
        SELECT YEAR(createdat) AS created_year, MONTH(createdat) AS created_month, COUNT(*) AS codesCreatedOnThisMonth
        FROM codes
        GROUP BY created_year, created_month
        ORDER BY created_year DESC, created_month DESC;
    `);

  const result = {
    transactionThisMonth: earnings[0].transactionThisMonth || 0,
    transactionThisYear: earnings[0].transactionThisYear || 0,
    codesMade: codes[0].codesCount || 0,
    doorOpen: opens[0].scanCount || 0,
    renewalsThisMonthCount: renewals[0].plansExpireThisMonth || 0,
    renewalsThisMonth: renewalsThisMonth,
    renewalsNextMonth: renewalsNextMonth,
    renewalsEveryMonth: renewalsEveryMonth,
    renewals: allRenewals,
    vendorCount: vendors[0].vendorCount,
    scanlogsEveryMonth: scanlogsEveryMonth,
    codesMadeEveryMonth: codesMadeEveryMonth,
    activeSubscriptions: transacts,
    allScanlogs: allScanlogs,
    allCodesMade: allCodesMade,
  };

  return result;
};

export const getVendors = async () => {
  const [rows] =
    await pool.query(`SELECT users.*, COALESCE(propertycount, 0) AS propertycount 
    FROM users 
    LEFT JOIN ( 
        SELECT userid, COUNT(propertyid) AS propertycount 
        FROM properties WHERE isdeleted = 0 GROUP BY userid 
        ) AS propertycounts ON users.userid = propertycounts.userid 
        WHERE users.usertype = 'V' AND users.isdeleted = 0;`);
  return rows;
};

export const applyGracePeriod = async (id, days) => {
  try {
    await pool.query(
      `UPDATE properties
        SET plan_expiry_date = DATE_ADD(plan_expiry_date, INTERVAL ? DAY)
        WHERE propertyid = ?`,
      [days, id]
    );
    return await getProperty(id);
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getVendor = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM users
    WHERE userid = ? AND usertype = 'V' AND isdeleted = 0`,
    [id]
  );
  return rows[0];
};

export const toggleVendorProperties = async (id) => {
  try {
    await pool.query(
      `
        UPDATE properties SET 
        isactive = CASE WHEN isactive= 0 THEN 1 ELSE 0 END
        WHERE propertyid = ?`,
      [id]
    );
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getVendorPropertiesWithRooms = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
        p.propertyid,
        p.propertyname AS Property_Name,
        COALESCE(sp.monthly_charge, 0) AS Current_Rate,
        p.number_of_rooms AS Number_Of_Rooms,
        p.occupancy_cap AS Occupancy_Cap,  -- Added Occupancy_Cap column
        COALESCE(p.last_pay_date, 'N/A') AS Last_Paid_Date,
        COALESCE(p.planid, 0) AS Plan_ID,
        COALESCE(p.plantype, 'N') AS Plan_Type,
        COALESCE(sp.monthly_charge, 0) AS Last_Billed_Amount,
        CASE
            WHEN p.plan_expiry_date >= CURDATE() AND p.isactive = 1 THEN
                CASE
                    WHEN p.plantype = 'M' THEN DATE_ADD(COALESCE(p.last_pay_date, CURDATE()), INTERVAL 1 MONTH)
                    WHEN p.plantype = 'Y' THEN DATE_ADD(COALESCE(p.last_pay_date, CURDATE()), INTERVAL 1 YEAR)
                    ELSE NULL
                END
            ELSE NULL
        END AS Next_Billing_Date
    FROM 
        properties p
    LEFT JOIN 
        subscription_plans sp ON p.planid = sp.planid
    WHERE 
        p.userid = ? AND p.isdeleted = 0;
    `,
    [id]
  );

  return rows;
};

export const updatePropertyDetailsInDB = async (
  propertyId,
  { newRate, occupancyCap }
) => {
  let updateFields = [];
  if (newRate !== null && newRate !== undefined) {
    updateFields.push(`current_rate = ?`); // Use parameterized query to prevent SQL injection
  }
  if (occupancyCap !== null && occupancyCap !== undefined) {
    updateFields.push(`occupancy_cap = ?`);
  }

  if (updateFields.length === 0) {
    throw new Error("No fields to update");
  }

  const query = `
    UPDATE properties 
    SET ${updateFields.join(", ")} 
    WHERE propertyid = ?
  `;

  // Parameters for the query
  const queryParams = [
    ...(newRate !== null && newRate !== undefined ? [newRate] : []),
    ...(occupancyCap !== null && occupancyCap !== undefined
      ? [occupancyCap ? 1 : 0]
      : []),
    propertyId,
  ];

  const [result] = await pool.execute(query, queryParams);
  return result;
};

export const deleteVendor = async (id) => {
  const vendor = await getVendor(id);

  if (!vendor) {
    return null; // Vendor not found
  }

  await pool.query(
    `
    UPDATE users SET 
    isdeleted = 1
    WHERE userid = ? AND usertype = 'V'`,
    [id]
  );

  return vendor;
};

export const updateVendor = async (id, name, businessName, email, mobile) => {
  const [result] = await pool.query(
    `SELECT * FROM users WHERE userid != ? AND (email = ? OR mobile = ?)`,
    [id, email, mobile]
  );
  console.log(result.length);
  if (result.length > 0) {
    return false;
  }
  await pool.query(
    `
    UPDATE users SET 
    fullname = ?,
    businessname = ?,
    email = ?, 
    mobile = ?
    WHERE userid = ? AND usertype = 'V'`,
    [name, businessName, email, mobile, id]
  );
  return await getVendor(id);
};

export const updateVendorPassword = async (id, password) => {
  await pool.query(
    `
    UPDATE users SET 
    password = ?
    WHERE userid = ? AND usertype = 'V'`,
    [sha256(password), id]
  );
  return await getVendor(id);
};

export const toggleVendorStatus = async (id) => {
  await pool.query(
    `
    UPDATE users SET 
    isactive = CASE WHEN isactive= 0 THEN 1 ELSE 0 END
    WHERE userid = ? AND usertype = 'V'`,
    [id]
  );
  return await getVendor(id);
};

export const createVendor = async (
  name,
  businessName,
  email,
  mobile,
  password
) => {
  // Check if email or mobile already exists
  const [existingUser] = await pool.query(
    `
        SELECT * FROM users WHERE (email = ? OR mobile = ?) AND isdeleted = 0`,
    [email, mobile]
  );

  if (existingUser.length > 0) {
    throw new Error("Email or mobile already exists");
  }

  // Insert the new vendor if email or mobile does not exist
  const [result] = await pool.query(
    `
        INSERT INTO users (fullname, businessname, email, mobile, password, usertype, datecreated)
        VALUES (?, ?, ?, ?, ?, 'V', ?)`,
    [name, businessName, email, mobile, sha256(password), currentDateAndTime()]
  );

  await pool.query(
    `INSERT INTO email_template (subject, body, type, vendorid) VALUES ("Confirmation of Reservation at [property_name]", "<p>Dear [customer_name],</p><p>We are absolutely delighted to confirm your reservation at [property_name].</p><p><br></p><p>Your comfort and satisfaction are of utmost importance to us, and we can't wait to extend our warmest welcome to you.</p><p>Reservation Details:</p><p><strong>Room Number: [room_name]</strong></p><p><strong>Check-In Date: [checkin_date]</strong></p><p><strong>Check-Out Date: [checkout_date]</strong></p><p><br></p><p><strong>Verification Code: [bar_code]</strong></p><p><br></p><p>Thank you for selecting [property_name] for your stay. We eagerly anticipate the opportunity to provide you with an exceptional and memorable experience.</p><p><br></p><p><em>Safe travels, and we look forward to your arrival!</em></p><p><br></p><p>Warm regards,</p><p>[vendor_name]</p><p>[property_name]</p>", "new_room", ? )`,
    [result.insertId]
  );

  return await getVendor(result.insertId);
};

// subscription

export const getSubscriptions = async () => {
  const [rows] = await pool.query(`SELECT * FROM subscription_plans
     WHERE isdeleted = 0
     ORDER by from_rooms_number ASC`);
  return rows;
};

export const getSubscription = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM subscription_plans
    WHERE planid = ? AND isdeleted = 0`,
    [id]
  );
  return rows[0];
};

export const deleteSubscription = async (id) => {
  const subscription = await getSubscription(id);

  if (!subscription) {
    return null; // Subscription not found
  }

  await pool.query(
    `
    UPDATE subscription_plans SET 
    isdeleted = 1
    WHERE planid = ?`,
    [id]
  );

  return subscription;
};

export const updateSubscription = async (
  id,
  fromRoomsNumber,
  toRoomsNumber,
  monthlyCharge,
  yearlyCharge
) => {
  await pool.query(
    `
    UPDATE subscription_plans SET 
    from_rooms_number = ?,
    to_rooms_number = ?, 
    monthly_charge = ?,
    yearly_charge = ?
    WHERE planid = ? `,
    [fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge, id]
  );
  return await getSubscription(id);
};

export const createSubscription = async (
  fromRoomsNumber,
  toRoomsNumber,
  monthlyCharge,
  yearlyCharge
) => {
  try {
    // Check if the combination already exists
    const [existingRecord] = await pool.query(
      `
    SELECT *
    FROM subscription_plans
    WHERE ((from_rooms_number <= ? AND to_rooms_number >= ?)
    OR (from_rooms_number >= ? AND to_rooms_number <= ?)
    OR (from_rooms_number <= ? AND to_rooms_number >= ? AND (from_rooms_number > ? OR to_rooms_number < ?))
    OR (from_rooms_number <= ? AND to_rooms_number >= ? AND (from_rooms_number < ? OR to_rooms_number > ?)))
    AND isdeleted = 0
`,
      [
        fromRoomsNumber,
        toRoomsNumber,
        fromRoomsNumber,
        toRoomsNumber,
        fromRoomsNumber,
        toRoomsNumber,
        fromRoomsNumber,
        toRoomsNumber,
        toRoomsNumber,
        fromRoomsNumber,
        toRoomsNumber,
        fromRoomsNumber,
      ]
    );

    if (existingRecord.length === 0) {
      // If the combination doesn't exist, insert the new record
      const [result] = await pool.query(
        `
            INSERT IGNORE INTO subscription_plans (from_rooms_number, to_rooms_number, monthly_charge, yearly_charge)
            VALUES (?, ?, ?, ?)
          `,
        [fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge]
      );

      return await getSubscription(result.insertId);
    } else {
      // If the combination already exists, you may handle it as needed
      console.log("Subscription plan already exists for the given range.");
      return null; // You can return an indication that the record wasn't inserted
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

//Reports

export const getExpiredReports = async () => {
  let query = `WITH RankedTransactions AS (
        SELECT
          properties.propertyid AS prop_id,
          properties.propertyname,
          properties.plan_expiry_date AS plan_expiry_date,
          transactions.*,
          users.userid AS user_id,
          users.fullname,
          users.mobile,
          users.email,
          users.isdeleted AS user_isdeleted,
          users.isactive AS user_isactive,
          ROW_NUMBER() OVER (PARTITION BY transactions.propertyid ORDER BY transactions.transaction_datetime DESC) AS rn
        FROM transactions
        JOIN users ON transactions.userid = users.userid AND users.isdeleted = 0 AND users.isactive = 1
        JOIN properties ON transactions.propertyid = properties.propertyid AND properties.isdeleted = 0 AND properties.isactive = 1
        WHERE (properties.plan_expiry_date IS NULL OR properties.plan_expiry_date < '${currentDateAndTime()}')
      )
      SELECT *
      FROM RankedTransactions
      WHERE rn = 1;`;
  console.log(query);
  const [result] = await pool.query(query);
  return result;
};

export const getRevenueByDate = async (fromDate, toDate) => {
  let query = `
    SELECT 
      DATE(transaction_datetime) AS date,
      COUNT(transactionid) AS transactions,
      SUM(amount) AS amount
    FROM transactions
    WHERE 1`;

  const params = [];

  if (isValidDate(fromDate)) {
    query += " AND transaction_datetime >= ?";
    params.push(fromDate);
  }

  if (isValidDate(toDate)) {
    query += " AND transaction_datetime <= ?";
    params.push(toDate);
  }

  // Group by the date part of transaction_datetime
  query += " GROUP BY date";

  const [result] = await pool.query(query, params);

  return result;
};

export const getTransactionReports = async (fromDate, toDate) => {
  // Build the query based on the validity of fromDate and toDate
  let query = `
    SELECT transactions.*, users.*, properties.*, subscription_plans.*
    FROM transactions
    LEFT JOIN users ON transactions.userid = users.userid
    LEFT JOIN properties ON transactions.propertyid = properties.propertyid
    LEFT JOIN subscription_plans ON properties.planid = subscription_plans.planid
    WHERE users.isdeleted = 0 AND properties.isdeleted = 0 AND users.isactive = 1 AND properties.isactive = 1 AND subscription_plans.isdeleted = 0`;

  const params = [];

  if (isValidDate(fromDate)) {
    query += " AND transactions.transaction_datetime >= ?";
    params.push(fromDate);
  }

  if (isValidDate(toDate)) {
    query += " AND transactions.transaction_datetime <= ?";
    params.push(toDate);
  }

  const [result] = await pool.query(query, params);
  return result;
};
