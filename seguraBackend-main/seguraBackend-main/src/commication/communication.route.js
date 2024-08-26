import express from 'express';
import * as communicationController from './communication.controller.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/sendEmail', [
    body('email').isEmail().withMessage('Email Id incorrect').notEmpty().withMessage('Email cannot be Empty'),
    body('subject').notEmpty().withMessage('Subject cannot be Empty'),
    body('body').notEmpty().withMessage('Body cannot be Empty'),
], communicationController.sendEmail);

router.post('/emailTemplate',[
    body('type').notEmpty().withMessage('Type is required'),
    body('id').notEmpty().withMessage('Id is required')
], communicationController.emailTemplate);

router.put('/emailTemplate', [
    body('subject').notEmpty().withMessage('Subject cannot be Empty'),
    body('body').notEmpty().withMessage('Body cannot be Empty'),
    body('type').notEmpty().withMessage('Type cannot be Empty'),
    body('id').notEmpty().withMessage('Id cannot be Empty'),
], communicationController.updateEmailTemplate);

export default router