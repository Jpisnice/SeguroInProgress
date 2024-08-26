import express from 'express';
import { body } from 'express-validator';
import * as vendorController from './vendor.controller.js';

const router = express.Router();

//properties

router.get('/properties', vendorController.getProperties);

router.get('/property/:id', vendorController.getProperty);
router.get('/propertyList/:id', vendorController.getPropertyList);

router.get('/propertiesByUserId/:id', vendorController.getPropertiesByUserId);

//updates new rate and new rate effective date
router.post('/updatePropertyRates/:id', vendorController.updatePropertyRates);


router.delete('/property/:id', vendorController.deleteProperty);

router.put('/property/:id', [
    body('propertyName').notEmpty().withMessage('Property name cannot be Empty'),
    body('address').notEmpty().withMessage('Address cannot be Empty'),
    body('city').notEmpty().withMessage('City cannot be Empty'),
    body('rooms').isNumeric().withMessage('Rooms should be Number').notEmpty().withMessage('Rooms cannot be Empty'),
], vendorController.updateProperty);

router.post('/property', [
    body('userId').isNumeric().withMessage('User Id should be Number').notEmpty().withMessage('User Id cannot be Empty'),
    body('propertyName').notEmpty().withMessage('Property name cannot be Empty'),
    body('address').notEmpty().withMessage('Address cannot be Empty'),
    body('city').notEmpty().withMessage('City cannot be Empty'),
    body('rooms').isNumeric().withMessage('Rooms should be Number').notEmpty().withMessage('Rooms cannot be Empty'),
], vendorController.createProperty);

router.post('/upgradePropertySubscription/:id', [
    body('planId').isNumeric().withMessage('Plan Id should be Number').notEmpty().withMessage('Plan Id cannot be Empty'),
    body('userId').isNumeric().withMessage('User Id should be Number').notEmpty().withMessage('User Id cannot be Empty'),
    body('planType').notEmpty().withMessage('Plan Type cannot be Empty').isIn(['M', 'Y']).withMessage('Plan Type should be either M or Y'),
], vendorController.upgradePropertySubscription);

router.post('/removePropertySubscription', [
    body('propertyId').isNumeric().withMessage('Property Id should be Number').notEmpty().withMessage('Property Id cannot be Empty'),
], vendorController.removePropertySubscription)

//customer List

router.get('/customers', vendorController.getCustomerList);
router.get('/customers/:id', vendorController.getCustomerbyVendorId);

router.get('/customer/:id', vendorController.getCustomer);

router.delete('/customer/:id', vendorController.deleteCustomer);

router.put('/customer/:id', [
    body('customerName').notEmpty().withMessage('Customer name cannot be Empty'),
    body('email').isEmail().withMessage('Invalid Email Id'),
    body('mobile').notEmpty().withMessage('Mobile Number cannot be blank'),
], vendorController.updateCustomer);

//area

router.get('/areasByPropertyId/:id', vendorController.getAreasByPropertyId);
router.post('/saveAreas/:id', vendorController.saveAreasByPropertyId);
router.post('/createArea', vendorController.createAreasByPropertyId);
router.get('/areaList/:id', vendorController.getAreaList);

//rooms

router.get('/roomsByPropertyId/:id', vendorController.getRoomsByPropertyId);
router.post('/roomsByUserId/:id', vendorController.getRoomsByUserId);
router.get('/roomDataByUserId/:id', vendorController.getRoomDataByUserId);
router.post('/roomStatus', vendorController.getRoomStatus);
router.post('/getCodeData', vendorController.getCodeData);

router.post('/roomsByPropertyId/:id', vendorController.saveRoomsByPropertyId);

//codes

router.get('/codesDashboard/:id', vendorController.getCodesDashboard);

router.post('/createNewCode/:id', [
    body('email').isEmail().withMessage('Invalid Email Id'),
], vendorController.createNewCode);

router.put('/updateCode/:id', vendorController.updateCode);

router.delete('/deleteCode/:id', vendorController.deleteCode);

//reports

router.post('/reportCodesMade/:id', vendorController.getReports)
router.post('/reportCustomers/:id', vendorController.getCustomerReports)
router.post('/doorOpenedCount/:id', vendorController.getDoorOpenedCountByUserId)
router.post('/transactionReports/:id', vendorController.getTransactionReports)

//stripes payment create subscription
router.post('/stripesPaymentIntent', [
    body('amount').notEmpty().withMessage('Amount cannot be empty'),
    body('email').notEmpty().withMessage('Email cannot be empty'),
    body('name').notEmpty().withMessage('Name cannot be empty'),
    body('paymentMethod').notEmpty().withMessage('Payment Method cannot be empty'),
    body('paymentType').notEmpty().withMessage('Payment Type cannot be empty'),
    body('paymentInterval').notEmpty().withMessage('Payment Interval cannot be empty'),

], vendorController.stripesPaymentIntent)

router.post('/cancelPaymentSubscription', [
    body('userId').notEmpty().withMessage('User Id cannot be empty'),
    body('propertyId').notEmpty().withMessage('Property Id cannot be empty'),
], vendorController.cancelStripesPaymentSubscription)

router.post('/stripesPaymentInvoice', [
    body('subscriptionId').notEmpty().withMessage('Subscription Id cannot be empty'),
], vendorController.getStripesInvoice)

router.post('/setCheckinCheckoutTime', [
    body('userId').notEmpty().withMessage('User Id cannot be empty'),
    body('checkInTime').notEmpty().withMessage('Checkin Time cannot be empty'),
    body('checkOutTime').notEmpty().withMessage('Checkout Time cannot be empty'),
], vendorController.setCheckinCheckoutTime)

router.get('/getCodes/:id', vendorController.getCodes);

export default router