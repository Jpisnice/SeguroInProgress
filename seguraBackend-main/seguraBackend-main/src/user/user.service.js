// user.service.js

import pool from "../../configs/database.js";
import crypto from 'crypto'

function sha256(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const generateCID = () => {
    return crypto.randomBytes(30).toString('hex');
};

export const getUsers = async () => {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
};

export const getUser = async (id) => {
    const [rows] = await pool.query(`
    SELECT * 
    FROM users
    WHERE userid = ?`, [id]);
    return rows[0];
};

export const deleteUser = async (id) => {
    const user = await getUser(id)

    if (!user) {
        return null; // User not found
    }

    await pool.query(`
    DELETE
    FROM users
    WHERE userid = ?`, [id]);

    return user;
};

export const updateUser = async (id, name, email, mobile, usertype) => {
    await pool.query(`
    UPDATE users SET 
    fullname = ?,
    email = ?, 
    mobile = ?,
    usertype = ?
    WHERE userid = ?`,
        [name, email, mobile, usertype, id]
    );
    return await getUser(id);
};


export const createUser = async (name, email, mobile, password, usertype) => {
    let token = generateCID();
    const [result] = await pool.query(`
    INSERT INTO users (fullname, email, mobile, password, usertype, token)
    VALUES (?, ?, ?, ?, ?)`,
        [name, email, mobile, sha256(password), usertype, token]
    );
    return await getUser(result.insertId);
};
