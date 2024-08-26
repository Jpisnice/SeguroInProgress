import { validationResult } from 'express-validator';
import * as userService from './user.service.js';

export const getUsers = async (req, res) => {
  const users = await userService.getUsers();
  res.send(users);
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  const user = await userService.getUser(id);
  if (!user) {
    res.status(301).send({
      message: 'User not found',
      data: null,
    });
  } else {
    res.status(200).send({
      data: user,
    });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const user = await userService.deleteUser(id);

  if (!user) {
    res.status(301).send({
      message: 'User not found',
      data: null,
    });
  } else {
    res.status(200).send({
      message: 'User deleted successfully',
      data: user,
    });
  }
};

export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  const id = req.params.id;
  if (errors.isEmpty()) {
    const { name, email, mobile, usertype } = req.body;
    const user = await userService.updateUser(id, name, email, mobile, usertype);
    if (!user) {
      res.status(300).send({
        message: 'User not found',
      });

    } else {
      res.status(200).send({
        message: 'User updated successfully',
        data: user,
      });

    }
  } else {
    res.status(300).send({
      message: 'Failed to Update User',
      data: errors,
    });
  }
};

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const { name, email, mobile, password, usertype } = req.body;
    const user = await userService.createUser(name, email, mobile, password, usertype);
    res.status(200).send({
      message: 'User created successfully',
      data: user,
    });
  } else {
    res.status(300).send({
      message: 'Failed to create User',
      data: errors,
    });
  }
};
