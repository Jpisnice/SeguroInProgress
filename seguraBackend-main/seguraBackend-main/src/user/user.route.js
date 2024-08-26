import express from 'express';
import { body } from 'express-validator';
import * as userController from './user.controller.js';

const router = express.Router();

router.get('/', userController.getUsers);

router.get('/:id', userController.getUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id', [
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Invalid Mobile Number'),
], userController.updateUser);

router.post('/', [
    body('name').notEmpty().withMessage('Name cannot be blank'),
    body('password').notEmpty().withMessage('Password cannot be blank'),
    body('usertype')
        .notEmpty().withMessage('User Type cannot be blank')
        .custom((value) => ['A', 'V', 'N'].includes(value))
        .withMessage('Invalid User Type'),
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Invalid Mobile Number'),
], userController.createUser);

export default router;