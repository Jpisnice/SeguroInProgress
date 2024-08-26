import { validationResult } from 'express-validator';
import * as adminService from './admin.service.js';
import { PassThrough } from 'stream';

export const getAdminDashboard = async (req, res) => {
    const dashboard = await adminService.getAdminDashboard();
    res.send(dashboard);
};

//vendor

export const getVendors = async (req, res) => {
    const vendors = await adminService.getVendors();
    res.send(vendors);
};

export const getVendor = async (req, res) => {
    const id = req.params.id;
    const vendor = await adminService.getVendor(id);
    if (!vendor) {
        res.status(400).send({
            message: 'Vendor not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: vendor,
        });
    }
};

export const getVendorProperties = async (req, res) => {
    const id = req.params.id;
    const vendor = await adminService.getVendorPropertiesWithRooms(id);
    if (!vendor) {
        res.status(400).send({
            message: 'Vendor not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: vendor,
        });
    }
};
export const toggleVendorProperties = async (req, res) => {
    const id = req.params.id;
    const property = await adminService.toggleVendorProperties(id);
    console.log(property)
    if (!property) {
        res.status(400).send({
            message: 'Property not found',
        });

    } else {
        res.status(200).send({
            message: property.isactive == "1" ? 'Property Status enabled successfully' : 'Property Status disabled successfully',
            data: property,
        });

    }
};

export const updatePropertyDetails = async (req, res) => {
  console.log("Request Params:", req.params);
  console.log("Request Body:", req.body);

  const propertyId = req.params.id; // Extract propertyId from URL params
  const { newRate, occupancyCap } = req.body; // Destructure from request body

  try {
    // Ensure propertyId is valid
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    // Call service to update property details
    const result = await updatePropertyDetailsInDB(propertyId, {
      newRate,
      occupancyCap,
    });
    return res.status(200).json({
      success: true,
      message: "Property details updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating property details:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating property details",
      error: error.message,
    });
  }
};

export const deleteVendor = async (req, res) => {
    const id = req.params.id;
    const vendor = await adminService.deleteVendor(id);

    if (!vendor) {
        res.status(400).send({
            message: 'Vendor not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: 'Vendor deleted successfully',
            data: vendor,
        });
    }
};

export const updateVendor = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { name, businessName, email, mobile } = req.body;
        const vendor = await adminService.updateVendor(id, name, businessName, email, mobile);
        if (!vendor) {
            res.status(400).send({
                message: 'Try some other email or mobile number',
            });

        } else {
            res.status(200).send({
                message: 'Vendor updated successfully',
                data: vendor,
            });

        }
    } else {
        res.status(400).send({
            message: 'Failed to Update Vendor',
            data: errors,
        });
    }
};

export const updateVendorPassword = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { password } = req.body;
        const vendor = await adminService.updateVendorPassword(id, password);
        if (!vendor) {
            res.status(400).send({
                message: 'Vendor not found',
            });

        } else {
            res.status(200).send({
                message: 'Vendor Password updated successfully',
                data: vendor,
            });

        }
    } else {
        res.status(400).send({
            message: 'Failed to Update Vendor Password',
            data: errors,
        });
    }
};



export const applyGracePeriod = async (req, res) => {
    const id = req.params.id;
    const {days} = req.body
    const property = await adminService.applyGracePeriod(id,days);
    if (!property) {
        res.status(400).send({
            message: 'Property not found',
        });

    } else {
        res.status(200).send({
            message: 'Grace Period Applied successfully',
            data: property,
        });

    }
};
export const toggleVendorStatus = async (req, res) => {
    const id = req.params.id;
    const vendor = await adminService.toggleVendorStatus(id);
    if (!vendor) {
        res.status(400).send({
            message: 'Vendor not found',
        });

    } else {
        res.status(200).send({
            message: vendor.isactive == "1" ? 'Vendor Status enabled successfully' : 'Vendor Status disabled successfully',
            data: vendor,
        });

    }
};

export const createVendor = async (req, res) => {
    const errors = validationResult(req);
    try{
        if (errors.isEmpty()) {
            const { name,businessName = "",email, mobile, password } = req.body;
            const vendor = await adminService.createVendor(name,businessName, email, mobile, password);
            res.status(200).send({
                message: 'Vendor created successfully',
                data: vendor,
            });
        } else {
            res.status(400).send({
                message: 'Failed to create Vendor',
                data: errors,
            });
        }

    }catch (err){
        console.log(err)
        res.status(400).send({
            message: 'Vendor Already exists',
        });
    }
};

//subscription

export const getSubscriptions = async (req, res) => {
    const subscriptions = await adminService.getSubscriptions();
    res.send(subscriptions);
};

export const getSubscription = async (req, res) => {
    const id = req.params.id;
    const subscription = await adminService.getSubscription(id);
    if (!subscription) {
        res.status(400).send({
            message: 'Subscription not found',
            data: null,
        });
    } else {
        res.status(200).send({
            data: subscription,
        });
    }
};

export const deleteSubscription = async (req, res) => {
    const id = req.params.id;
    const subscription = await adminService.deleteSubscription(id);

    if (!subscription) {
        res.status(400).send({
            message: 'Subscription not found',
            data: null,
        });
    } else {
        res.status(200).send({
            message: 'Subscription deleted successfully',
            data: subscription,
        });
    }
};

export const updateSubscription = async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    if (errors.isEmpty()) {
        const { fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge } = req.body;
        const subscription = await adminService.updateSubscription(id, fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge);
        if (!subscription) {
            res.status(400).send({
                message: 'Subscription not found',
            });

        } else {
            res.status(200).send({
                message: 'Subscription updated successfully',
                data: subscription,
            });

        }
    } else {
        res.status(400).send({
            message: 'Failed to Update Subscription',
            data: errors,
        });
    }
};

export const createSubscription = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge } = req.body;
        const subscription = await adminService.createSubscription(fromRoomsNumber, toRoomsNumber, monthlyCharge, yearlyCharge);
        if(!subscription){
            res.status(422).send({
                message: 'Subscription already Exists',
            });

        }else{
            res.status(200).send({
                message: 'Subscription created successfully',
                data: subscription,
            });

        }
    } else {
        res.status(400).send({
            message: 'Failed to create Subscription',
            data: errors,
        });
    }
};

export const getReports = async (req, res) => {
    const { reportType = null, fromDate = null, toDate = null } = req.body || {}
    console.log(req.body)
    switch (reportType) {
        case "expired": {
            const subscription = await adminService.getExpiredReports();
            res.status(200).send({
                data: subscription,
            });
        }
        case "revenue": {
            const subscription = await adminService.getRevenueByDate(fromDate,toDate);
            res.status(200).send({
                data: subscription,
            });
        }
        case "transaction": {
            const subscription = await adminService.getTransactionReports(fromDate,toDate);
            res.status(200).send({
                data: subscription,
            });
        }
        default : {
            res.status(400).send({
                message: "Specify report type 'expired', 'revenue' or 'transaction'",
            });
        }
    }

}
export const getExpiredReports = async (req, res) => {
    const subscription = await adminService.getExpiredReports();
    res.status(200).send({
        data: subscription,
    });
}
export const getRevenueByDate = async (req, res) => {
    const { fromDate = null, toDate = null } = req.body || {};
    const subscription = await adminService.getRevenueByDate(fromDate, toDate);
    res.status(200).send({
        data: subscription,
    });
}
export const getTransactionReports = async (req, res) => {
    const { fromDate = null, toDate = null } = req.body || {};
    const subscription = await adminService.getTransactionReports(fromDate, toDate);
    res.status(200).send({
        data: subscription,
    });
} 