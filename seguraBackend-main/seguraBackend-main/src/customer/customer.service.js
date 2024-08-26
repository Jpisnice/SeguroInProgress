// customer.service.js

import pool from "../../configs/database.js";

export const getCustomers = async () => {
    const [rows] = await pool.query('SELECT * FROM customers');
    return rows;
};

export const getCustomer = async (id) => {
    const [rows] = await pool.query(`
    SELECT * 
    FROM customers
    WHERE customerid = ?`, [id]);
    return rows[0];
};

export const deleteCustomer = async (id) => {
    const customer = await getCustomer(id)

    if (!customer) {
        return null; // Customer not found
    }

    await pool.query(`
    DELETE
    FROM customers
    WHERE customerid = ?`, [id]);

    return customer;
};

export const updateCustomer = async (id, name, email, mobile) => {
    await pool.query(`
    UPDATE customers SET 
    customername = ?,
    email = ?, 
    mobile = ?
    WHERE customerid = ?`,
        [name, email, mobile, id]
    );
    return await getCustomer(id);
};


export const createCustomer = async (name, email, mobile) => {
    const [result] = await pool.query(`
    INSERT INTO customers (customername, email, mobile, datecreated)
    VALUES (?, ?, ?, NOW())`,
        [name, email, mobile]
    );
    return await getCustomer(result.insertId);
};
