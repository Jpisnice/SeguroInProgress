
import { validationResult } from 'express-validator';
import * as vendorService from './vendor.service.js';

//Properties

export const getProperties = async (req, res) => {
    const properties = await vendorService.getProperties();
    res.send(properties);
};

export const getProperty = async (req, res) => {
    const id = req.params.id;
    const property = await vendorService.getProperty(id);
    if (!property) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: property,
        });
    }
};

export const getPropertyList = async (req, res) => {
    const id = req.params.id;
    const property = await vendorService.getPropertyList(id);
    if (!property) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: property,
        });
    }
};

export const getPropertiesByUserId = async (req, res) => {
    const id = req.params.id;
    const properties = await vendorService.getPropertiesByUserId(id);

    res.status(200).send({
        data: properties ?? [],
    });
};

//updates new rate and new rate effective date
export const updatePropertyRates = async (req, res) => {
    const { id } = req.params;
    const { newRate, newRateEffectiveOn } = req.body;

    try {
        const result = await vendorService.updatePropertyRates(id, newRate, newRateEffectiveOn);
        res.status(200).send({ message: 'Property rates updated successfully', result });
    } catch (error) {
        res.status(500).send({ message: 'Error updating property rates', error });
    }
};



export const deleteProperty = async (req, res) => {
    const id = req.params.id;
    const property = await vendorService.deleteProperty(id);

    if (!property) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: 'Property deleted successfully',
            data: property,
        });
    }
};

export const upgradePropertySubscription = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { planId, planType, userId, paymentMethod = "online", paymentReference = "null" } = req.body;
        const property = await vendorService.ugradePropertySubscription(id, userId, planId, planType, paymentMethod, paymentReference);
        if (!property) {
            res.status(422).send({
                message: 'Property not found',
            });

        } else {
            res.status(200).send({
                message: 'Property Subscription upgraded successfully',
                data: property,
            });

        }
    } else {
        res.status(422).send({
            message: 'Failed to Upgrade Property Subscription',
            data: errors,
        });
    }
}
export const removePropertySubscription = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { propertyId } = req.body;
        const property = await vendorService.removePropertySubscription(propertyId)
        if (!property) {
            res.status(422).send({
                message: 'Failed to cancel subscriptions',
            });

        } else {
            res.status(200).send({
                message: 'Property subscription removed successfully',
                data: property,
            });

        }
    } else {
        res.status(422).send({
            message: 'Failed to Upgrade Property Subscription',
            data: errors,
        });
    }
}

export const updateProperty = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { propertyName, address, rooms, city } = req.body;
        const property = await vendorService.updateProperty(id, propertyName, address, city, rooms);
        if (!property) {
            res.status(422).send({
                message: 'Property not found',
            });

        } else {
            res.status(200).send({
                message: 'Property updated successfully',
                data: property,
            });

        }
    } else {
        res.status(422).send({
            message: 'Failed to Update Property',
            data: errors,
        });
    }
};

export const createProperty = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { userId, propertyName, address, city, rooms } = req.body;
        const property = await vendorService.createProperty(userId, propertyName, address, city, rooms);
        res.status(200).send({
            message: 'Property created successfully',
            data: property,
        });
    } else {
        res.status(422).send({
            message: 'Failed to create Property',
            data: errors,
        });
    }
};


//Customer List

export const getCustomerList = async (req, res) => {
    const customers = await vendorService.getCustomerList();
    res.send(customers);
};

export const getCustomerbyVendorId = async (req, res) => {
    const id = req.params.id;
    const customer = await vendorService.getCustomerListbyVendorId(id);
    if (!customer) {
        res.status(422).send({
            message: 'Customers not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: customer,
        });
    }
};
export const getCustomer = async (req, res) => {
    const id = req.params.id;
    const customer = await vendorService.getCustomer(id);
    if (!customer) {
        res.status(422).send({
            message: 'Customer not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: customer,
        });
    }
};

export const deleteCustomer = async (req, res) => {
    const id = req.params.id;
    const customer = await vendorService.deleteCustomer(id);

    if (!customer) {
        res.status(422).send({
            message: 'Customer not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: 'Customer deleted successfully',
            data: customer,
        });
    }
};

export const updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { customerName, email, mobile } = req.body;
        const customer = await vendorService.updateCustomer(id, customerName, email, mobile);
        if (!customer) {
            res.status(422).send({
                message: 'Customer not found',
            });

        } else {
            res.status(200).send({
                message: 'Customer updated successfully',
                data: customer,
            });

        }
    } else {
        res.status(422).send({
            message: 'Failed to Update Customer',
            data: errors,
        });
    }
};

//Areas

export const getAreasByPropertyId = async (req, res) => {
    const id = req.params.id;
    const areas = await vendorService.getAreasByPropertyId(id);
    if (!areas) {
        res.status(422).send({
            message: 'Area not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: areas,
        });
    }
};

export const saveAreasByPropertyId = async (req, res) => {
    const id = req.params.id;
    const { areas } = req.body
    const result = await vendorService.saveAreasByPropertyId(id, areas);
    if (!result) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: "Areas saved successfully",
            data: result,
        });
    }
};

export const createAreasByPropertyId = async (req, res) => {
    const { areaData } = req.body
    const result = await vendorService.createAreasByPropertyId(areaData);
    if (!result) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: "Areas Created Successfully",
            data: result,
        });
    }
};

export const getAreaList = async (req, res) => {
    const id = req.params.id;
    const areas = await vendorService.getAreaList(id);
    if (!areas) {
        res.status(422).send({
            message: 'Area not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: areas,
        });
    }
};

//Rooms

export const getRoomsByPropertyId = async (req, res) => {
    const id = req.params.id;
    const rooms = await vendorService.getRoomsByPropertyId(id);
    if (!rooms) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: rooms,
        });
    }
};

export const getRoomsByUserId = async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const { checkInDate, checkOutDate } = req.body
    const rooms = await vendorService.getRoomsByUserId(id, checkInDate, checkOutDate);
    if (!rooms) {
        res.status(422).send({
            message: 'User not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: rooms,
        });
    }
};

export const getRoomDataByUserId = async (req, res) => {
    const id = req.params.id;
    const rooms = await vendorService.getRoomDataByUserId(id);
    if (!rooms) {
        res.status(422).send({
            message: 'User not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: rooms,
        });
    }
};

export const getRoomStatus = async (req, res) => {
    const date = req.body.date;
    const roomId = req.body.roomId;
    const roomData = await vendorService.getRoomStatus(date, roomId);
    if (!roomData) {
        res.status(422).send({
            message: 'Data Not Found!',
            data: null,
        });
    } else {
        res.status(200).send({
            data: roomData,
        });
    }
};

export const getCodeData = async (req, res) => {
    const codeId = req.body.codeId;
    const codeData = await vendorService.getCodeData(codeId);
    if (!codeData) {
        res.status(422).send({
            message: 'Data Not Found!',
            data: null,
        });
    } else {
        res.status(200).send({
            data: codeData,
        });
    }
};

export const saveRoomsByPropertyId = async (req, res) => {
    const id = req.params.id;
    const { rooms } = req.body
    const result = await vendorService.saveRoomsByPropertyId(id, rooms);
    if (!result) {
        res.status(422).send({
            message: 'Property not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: "Rooms saved successfully",
            data: result,
        });
    }
};

//codes Dashboard

export const getCodesDashboard = async (req, res) => {
    const id = req.params.id;
    const rooms = await vendorService.getCodesDashboard(id);
    if (!rooms) {
        res.status(422).send({
            message: 'Data not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: rooms,
        });
    }
};

export const createNewCode = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    console.log(req.body)
    if (errors.isEmpty()) {
        const { customerName, email, mobile, roomId, checkInDate, checkInTime, checkOutDate, checkOutTime } = req.body
        const result = await vendorService.createNewCode(id, customerName, email, mobile, roomId, checkInDate, checkInTime, checkOutDate, checkOutTime);
        if (!result) {
            res.status(422).send({
                message: 'Room not found',
            });
        } else {
            res.status(200).send({
                data: result,
            });
        }
    } else {
        res.status(422).send({
            message: 'Failed to add code',
            data: errors,
        });
    }
};

export const updateCode = async (req, res) => {
    const id = req.params.id;
    const { roomId, checkInDate, checkInTime, checkOutDate, checkOutTime } = req.body
    const result = await vendorService.updateCode(id, roomId, checkInDate, checkInTime, checkOutDate, checkOutTime);
    if (!result) {
        res.status(422).send({
            message: 'Room is not available',
        });
    } else {
        res.status(200).send({
            data: result,
        });
    }
};

export const deleteCode = async (req, res) => {
    const id = req.params.id
    const result = await vendorService.deleteCode(id)

    res.status(200).send({
        message: "Deleted Successfully"
    })
}

export const getReports = async (req, res) => {
    const id = req.params.id;
    const { fromDate = null, toDate = null, propertyId = "" } = req.body || {};
    const reports = await vendorService.getCodeReportByUserId(id, fromDate, toDate, propertyId);
    if (!reports) {
        res.status(422).send({
            message: 'Report not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: reports,
        });
    }
};

export const getCustomerReports = async (req, res) => {
    const id = req.params.id;
    const { fromDate = null, toDate = null, propertyId = "" } = req.body || {};
    const reports = await vendorService.getCustomerReportByUserId(id, fromDate, toDate, propertyId);
    if (!reports) {
        res.status(422).send({
            message: 'Report not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: reports,
        });
    }
};
export const getTransactionReports = async (req, res) => {
    const id = req.params.id;
    const { fromDate = null, toDate = null } = req.body || {};
    const reports = await vendorService.getTransactionReports(id, fromDate, toDate);
    if (!reports) {
        res.status(422).send({
            message: 'Transactions not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: reports,
        });
    }
};
export const getDoorOpenedCountByUserId = async (req, res) => {
    const id = req.params.id;
    const { fromDate = null, toDate = null, propertyId = "" } = req.body || {};
    const reports = await vendorService.getDoorOpenedCountByUserId(id, fromDate, toDate, propertyId);
    if (!reports) {
        res.status(422).send({
            message: 'Report not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: reports,
        });
    }
};

export const stripesPaymentIntent = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { amount, name, email, paymentMethod, paymentType, paymentInterval } = req.body
        const intent = await vendorService.stripesPaymentIntent(amount, paymentType, name, email, paymentMethod, paymentInterval)
        res.status(200).send({
            message: 'Payment Intent fetched successfully',
            data: intent
        })
    } else {
        res.status(422).send({
            message: 'Failed to make payment',
            data: errors,
        });
    }
}

export const cancelStripesPaymentSubscription = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { userId, propertyId } = req.body
        const intent = await vendorService.cancelStripesPaymentSubscription(userId, propertyId)

        if (intent) {
            res.status(200).send({
                message: 'Subcription cancelled successfully',
                data: intent
            })
        } else {
            res.status(200).send({
                message: 'Failed to cancel subscription',
                data: intent
            })
        }

    } else {
        res.status(422).send({
            message: 'Failed to cancel subscription',
            data: errors,
        });
    }
}
export const getStripesInvoice = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { subscriptionId } = req.body
        const intent = await vendorService.getInvoice(subscriptionId)

        if (intent) {
            res.status(200).send({
                message: 'Invoice Link successfully',
                data: intent
            })
        } else {
            res.status(200).send({
                message: 'Failed to fetch Invoice',
                data: intent
            })
        }
    } else {
        res.status(422).send({
            message: 'Failed to fetch Invoice',
            data: errors,
        });
    }
}

export const setCheckinCheckoutTime = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { userId, checkInTime, checkOutTime } = req.body
        const user = await vendorService.setDefaultCheckinCheckoutTime(userId, checkInTime, checkOutTime)

        if (user) {
            res.status(200).send({
                message: 'Checkin Checkout time set successfully',
            })
        } else {
            res.status(200).send({
                message: 'Failed to set Checkin Checkout time',
            })
        }

    } else {
        res.status(422).send({
            message: 'Failed to set Checkin Checkout time',
            data: errors,
        });
    }
}

export const getCodes = async (req, res) => {
    const id = req.params.id;
    const codeData = await vendorService.getCodes(id);
    if (!codeData) {
        res.status(422).send({
            message: 'Data not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: codeData,
        });
    }
};