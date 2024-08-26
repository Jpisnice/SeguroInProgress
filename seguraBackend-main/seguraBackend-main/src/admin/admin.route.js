import express from 'express';
import { body } from 'express-validator';
import * as adminController from './admin.controller.js';

const router = express.Router();

router.get('/dashboard', adminController.getAdminDashboard);

//vendor 
router.get('/vendor', adminController.getVendors);

router.get('/vendor/:id', adminController.getVendor);

router.delete('/vendor/:id', adminController.deleteVendor);

router.put('/vendor/:id', [
    body('name').notEmpty().withMessage('Name cannot be Empty'),
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').notEmpty().withMessage('Mobile Number cannot be blank'),
], adminController.updateVendor);

router.get('/vendorProperties/:id', adminController.getVendorProperties);

router.post('/toggleVendorProperties/:id', adminController.toggleVendorProperties);

router.put("/updatePropertyDetails/:id", adminController.updatePropertyDetails);

router.post('/applyGracePeriod/:id', adminController.applyGracePeriod)

router.post('/vendor', [
    body('name').notEmpty().withMessage('Name cannot be blank'),
    body('password').notEmpty().withMessage('Password cannot be blank'),
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').notEmpty().withMessage('Mobile Number cannot be blank'),
], adminController.createVendor);

router.put('/vendorChangePassword/:id', [
    body('password').notEmpty().withMessage('Password cannot be Empty'),
], adminController.updateVendorPassword);

router.post('/toggleVendorStatus/:id', adminController.toggleVendorStatus);

//subscription 

router.get('/subscription', adminController.getSubscriptions);

router.get('/subscription/:id', adminController.getSubscription);

router.delete('/subscription/:id', adminController.deleteSubscription);

router.put('/subscription/:id', [
    body('fromRoomsNumber').notEmpty().withMessage('From Rooms Number cannot be Empty').isNumeric().withMessage('From Rooms Number should be a number'),
    body('toRoomsNumber').notEmpty().withMessage('to Rooms Number cannot be Empty').isNumeric().withMessage('to Rooms Number should be a number'),
    body('monthlyCharge').notEmpty().withMessage('monthly Charge cannot be Empty').isNumeric().withMessage('monthly Charge should be a number'),
    body('yearlyCharge').notEmpty().withMessage('yearly Charge cannot be Empty').isNumeric().withMessage('yearly Charge should be a number'),
], adminController.updateSubscription);


router.post('/subscription', [
    body('fromRoomsNumber').notEmpty().withMessage('From Rooms Number cannot be Empty').isNumeric().withMessage('From Rooms Number should be a number'),
    body('toRoomsNumber').notEmpty().withMessage('to Rooms Number cannot be Empty').isNumeric().withMessage('to Rooms Number should be a number'),
    body('monthlyCharge').notEmpty().withMessage('monthly Charge cannot be Empty').isNumeric().withMessage('monthly Charge should be a number'),
    body('yearlyCharge').notEmpty().withMessage('yearly Charge cannot be Empty').isNumeric().withMessage('yearly Charge should be a number'),
], adminController.createSubscription);

// Reports
router.post('/reports', adminController.getReports);
router.get('/expiredReports', adminController.getExpiredReports);
router.get('/revenueByDateReports', adminController.getRevenueByDate);
router.get('/transactionReports', adminController.getTransactionReports);


export default router;