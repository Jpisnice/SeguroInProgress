import express from 'express';
import { body } from 'express-validator';
import * as customerController from './customer.controller.js';

const router = express.Router();

router.get('/', customerController.getCustomers);

router.get('/:id', customerController.getCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.put('/:id', [
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Invalid Mobile Number'),
], customerController.updateCustomer);

router.post('/', [
    body('name').notEmpty().withMessage('Name cannot be blank'),
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Invalid Mobile Number'),
], customerController.createCustomer);

export default router;