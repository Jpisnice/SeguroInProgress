import express from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller.js';

const router = express.Router();

router.post('/login', [
    body('loginId').notEmpty().withMessage('Login Id cannot be blank'),
    body('password').notEmpty().withMessage('Password cannot be blank')
], authController.login)

router.post('/changePassword/:id', [
    body('oldPassword').notEmpty().withMessage('Old Password cannot be blank'),
    body('newPassword').notEmpty().withMessage('New Password cannot be blank')
], authController.changePassword)

router.post('/scanCode', [
    body('code').notEmpty().withMessage('Code is required'),
    body('userid').notEmpty().withMessage('User Id is required')
], authController.scanCode)

router.post('/syncData', [
    body('roomData').isArray({ min: 1 }).withMessage('Room Data is required').custom((value, { req }) => {
        for (let i = 0; i < value.length; i++) {
            const datetime = value[i].doorOpenTime;

            if (!isValidDatetime(datetime) || value[i].code == "") {
                throw new Error(`Invalid data at index ${i}`);
            }
        }

        return true;
    }).withMessage('Room Data must be an array of valid datetimes and codes')
], authController.syncData)

router.post('/scanCode/:id', authController.scanCodeById)

router.post('/checkToken', [
    body('token').notEmpty().withMessage('Token is Required')
], authController.checkToken);

router.post('/resetPassword', [
    body('password').notEmpty().withMessage('Password is Required'),
    body('confirmPassword').notEmpty().withMessage('Password Confirmation is Required'),
    body('token').notEmpty().withMessage('Token Is Required')
], authController.resetPassword);

function isValidDatetime(datetime) {
    const parsedDate = new Date(datetime);
    return !isNaN(parsedDate.getTime());
}

export default router;