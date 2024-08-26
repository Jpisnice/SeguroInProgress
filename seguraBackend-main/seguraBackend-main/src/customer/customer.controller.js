import { validationResult } from 'express-validator';
import * as customerService from './customer.service.js';

export const getCustomers = async (req, res) => {
  const customers = await customerService.getCustomers();
  res.send(customers);
};

export const getCustomer = async (req, res) => {
  const id = req.params.id;
  const customer = await customerService.getCustomer(id);
  if (!customer) {
    res.status(301).send({
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
  const customer = await customerService.deleteCustomer(id);

  if (!customer) {
    res.status(301).send({
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
    const { name, email, mobile } = req.body;
    const customer = await customerService.updateCustomer(id,name, email, mobile);
    if(!customer){
        res.status(300).send({
          message: 'Customer not found',
        });

    }else{
        res.status(200).send({
          message: 'Customer updated successfully',
          data: customer,
        });

    }
  } else {
    res.status(300).send({
      message: 'Failed to Update Customer',
      data: errors,
    });
  }
};

export const createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const { name, email, mobile } = req.body;
    const customer = await customerService.createCustomer(name, email, mobile);
    res.status(200).send({
      message: 'Customer created successfully',
      data: customer,
    });
  } else {
    res.status(300).send({
      message: 'Failed to create Customer',
      data: errors,
    });
  }
};
