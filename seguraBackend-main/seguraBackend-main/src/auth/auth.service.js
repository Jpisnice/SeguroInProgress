import pool from "../../configs/database.js";
import crypto from 'crypto'
import CryptoJS from 'crypto-js'

function sha256(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const generateCID = () => {
    return crypto.randomBytes(30).toString('hex');
};

function hashPassword(password) {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

function comparePasswords(plainPassword, hashedPassword) {
    const hashedInputPassword = hashPassword(plainPassword);
    return hashedInputPassword === hashedPassword;
}


export const login = async (loginId, password) => {
    const [row] = await pool.query('SELECT * FROM users WHERE (email = ? OR mobile = ?) AND isdeleted = 0 LIMIT 1', [loginId, loginId])
    if (comparePasswords(password, row[0]?.password)) {
        if (row[0].isactive == 0) {
            return "inactive"
        }
        return row[0]
    }
    return false
}

export const changePassword = async (userId, oldPass, newPass) => {
    const [row] = await pool.query('SELECT * FROM users WHERE userid = ? LIMIT 1', [userId])
    if (comparePasswords(oldPass, row[0].password)) {
        await pool.query('UPDATE users SET password = ? WHERE userid = ? LIMIT 1', [sha256(newPass), userId])
        return row[0]
    }
    console.log(comparePasswords(oldPass, row[0].password))
    return false
}

export const scanCode = async (code, userId) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDate.getDate()).slice(-2);
    const hours = ('0' + currentDate.getHours()).slice(-2);
    const minutes = ('0' + currentDate.getMinutes()).slice(-2);
    const seconds = ('0' + currentDate.getSeconds()).slice(-2);


    try {
        const [vendor] = await pool.query('SELECT * FROM users WHERE userid = ?', [userId])
        console.log(vendor[0])
        const systemTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        const systemDate = `${year}-${month}-${day}`;
        console.log(systemTime)
        const [row] = await pool.query('SELECT *, rooms.password as roomRelay FROM codes JOIN rooms ON codes.roomid = rooms.roomid WHERE barcode = ? AND checkoutdatetime > ? AND checkindatetime < ? AND codes.isdeleted = 0 LIMIT 1', [code, systemTime, systemTime]);

        console.log(row)

        let isValid = "invalid";

        if (row[0]) {
            isValid = "valid";
            const [propertyData] = await pool.query('SELECT propertyid, propertyname, propertyIpAddress, propertyUnlockDuration, password as propRelay FROM properties WHERE propertyid=?', [row[0].propertyid]);
            await pool.query('INSERT INTO `codescanlogs`(`code`, `scandatetime`, `isfoundvalid`) VALUES (?, ?, "1")', [row[0].barcode, systemTime]);

            // const [codeData] = await pool.query(`
            //     SELECT 
            //         codes.barcode AS qrCode, 
            //         codes.checkindatetime AS checkInDate, 
            //         codes.checkoutdatetime AS checkOutDate,
            //         CONCAT(rooms.ip_address, ', ', GROUP_CONCAT(areas.areaIpAddress SEPARATOR ', ')) AS ipList,
            //         CONCAT(rooms.unlock_duration, ', ', GROUP_CONCAT(areas.areaUnlockDuration SEPARATOR ', ')) AS unlockTimeList
            //     FROM codes 
            //     JOIN rooms ON rooms.roomid = codes.roomid
            //     JOIN properties ON rooms.propertyid = properties.propertyid 
            //     JOIN areas ON properties.propertyid = areas.propertyId 
            //     WHERE codes.barcode = ? 
            //       AND codes.isdeleted = 0 
            //       AND properties.isdeleted = 0 
            //       AND properties.isactive = 1
            //     GROUP BY codes.barcode, codes.checkindatetime, codes.checkoutdatetime
            // `, [code]);

            const [codeData] = await pool.query(`
                SELECT 
                    codes.barcode AS qrCode, 
                    codes.checkindatetime AS checkInDate, 
                    codes.checkoutdatetime AS checkOutDate,
                    CONCAT(rooms.ip_address, IFNULL(CONCAT(', ', GROUP_CONCAT(areas.areaIpAddress SEPARATOR ', ')), '')) AS ipList,
                    CONCAT(rooms.unlock_duration, IFNULL(CONCAT(', ', GROUP_CONCAT(areas.areaUnlockDuration SEPARATOR ', ')), '')) AS unlockTimeList
                FROM codes 
                JOIN rooms ON rooms.roomid = codes.roomid
                JOIN properties ON rooms.propertyid = properties.propertyid 
                LEFT JOIN areas ON properties.propertyid = areas.propertyId 
                WHERE codes.barcode = ? 
                  AND codes.isdeleted = 0 
                  AND properties.isdeleted = 0 
                  AND properties.isactive = 1
                GROUP BY codes.barcode, codes.checkindatetime, codes.checkoutdatetime, rooms.ip_address, rooms.unlock_duration
            `, [code]);


            return {
                isValid: 'valid',
                data: codeData[0],
                vendor: vendor[0],
                propertyData: propertyData[0]
            }
        } else {
            const [result] = await pool.query(`SELECT * FROM codes WHERE barcode = ? AND checkindatetime > CONCAT(?, ' 23:59:59') AND isdeleted = 0 LIMIT 1`, [code, systemDate]);
            if (result[0]) {
                isValid = 'early';
            } else {
                isValid = 'invalid'
            }
            // await pool.query('INSERT INTO `codescanlogs`(`code`, `scandatetime`, `isfoundvalid`) VALUES (?, ?, "0")', [code, systemTime]);
        }

        return {
            isValid: isValid,
            vendor: vendor[0]
        };

    } catch (err) {
        console.log(err)
        return {
            isValid: 'invalid1'
        }
    }
};

export const syncData = async (roomData) => {
    try {
        let validCode = true;
        for (let j = 0; j < roomData.length; j++) {
            const [row] = await pool.query('SELECT * FROM codes JOIN rooms ON codes.roomid = rooms.roomid WHERE barcode = ? AND codes.isdeleted = 0 LIMIT 1', [roomData[j].code]);
            if (!row[0]) {
                validCode = false;
                break;
            }
        }

        if (validCode) {
            for (let i = 0; i < roomData.length; i++) {
                await pool.query('INSERT INTO `codescanlogs`(`code`, `scandatetime`, `isfoundvalid`) VALUES (?, ?, "1")', [roomData[i].code, roomData[i].doorOpenTime]);
            }

            return {
                isValid: 'valid'
            }
        } else {
            return {
                isValid: 'invalid'
            };
        }
    } catch (err) {
        return {
            isValid: 'invalid'
        }
    }
};

export const checkToken = async (token) => {
    const [validUser] = await pool.query(`SELECT * FROM users WHERE token=? AND isactive=1 AND isdeleted=0`, [token]);
    let userPresent = (validUser.length === 1) ? true : false;
    return userPresent;
}

export const resetPassword = async (password, token) => {
    const [validUser] = await pool.query(`SELECT*FROM users WHERE token = ? LIMIT 1`, [token]);

    if (validUser.length === 1) {
        let newToken = generateCID();
        let newPassword = sha256(password);

        await pool.query(`UPDATE users SET password = ?, token=? WHERE userid = ? LIMIT 1`, [newPassword, newToken, validUser[0].userid]);
        return true;
    }
    else {
        return false;
    }
}