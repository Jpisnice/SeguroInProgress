import { validationResult } from 'express-validator';
import * as authService from './auth.service.js';

export const login = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { loginId, password } = req.body
        const loginData = await authService.login(loginId, password)
        if (loginData) {
            if (loginData == "inactive") {
                res.status(400).send({
                    message: "Sorry your account is deactivated now.",
                })
            }
            res.status(200).send({
                message: "Login Successful",
                data: loginData
            })
        } else {
            res.status(400).send({
                message: "Invalid email or password",
            })
        }
    } else {
        res.status(400).send({
            message: "Invalid login details",
            data: errors
        })
    }
}

export const changePassword = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const id = req.params.id
        const { oldPassword, newPassword } = req.body
        const data = await authService.changePassword(id, oldPassword, newPassword)
        if (data) {
            res.status(200).send({
                message: "Password Changed Successful",
                data: data
            })
        } else {
            res.status(400).send({
                message: "Password doesn't match",
            })
        }
    } else {
        res.status(400).send({
            message: "Invalid Input",
            data: errors
        })
    }
}

export const scanCode = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { code, userid } = req.body
        const data = await authService.scanCode(code, userid)
        console.log(data)
        if (data.isValid == "valid") {
            res.status(200).send({
                message: "Code is Valid",
                data: {
                    "isValid": true,
                    "data": data.data,
                    "propertyData": data.propertyData
                }
            })
        } else if (data.isValid == 'early') {
            res.status(300).send({
                message: `Sorry, It seems you are checking in early. If you need further assistance please contact (${data.vendor?.mobile} or ${data.vendor?.email})`,
                data: {
                    "isValid": false
                }
            })
        } else {
            if (data.vendor) {
                res.status(300).send({
                    message: `Sorry this code is invalid. If you need further assistance please contact (${data.vendor?.mobile} or ${data.vendor?.email})`,
                    data: {
                        "isValid": false
                    }
                })

            } else {

                res.status(300).send({
                    message: "Code is Invalid",
                    data: {
                        "isValid": false
                    }
                })
            }
        }
    } else {
        res.status(400).send({
            message: "Invalid Input",
            data: errors,
            body: req.body
        })
    }
}

export const syncData = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { roomData } = req.body
        const data = await authService.syncData(roomData)

        if (data.isValid == "valid") {
            res.status(200).send({
                message: "Data Saved Successfully!"
            })
        }
        else {
            res.status(404).send({
                message: "InValid Code!"
            })
        }
    } else {
        res.status(422).send({
            message: "Validation Error!",
            data: errors
        })
    }
}

export const scanCodeById = async (req, res) => {
    const id = req.params.id;
    const data = await authService.scanCode(id)
    if (data == "valid") {
        res.status(200).send({
            message: "Code is Valid",
            data: {
                "isValid": true
            }
        })
    } else if (data == 'early') {
        res.status(300).send({
            message: "Sorry, It seems you are checking in early. Please check in at the right time.",
            data: {
                "isValid": false
            }
        })
    } else {
        res.status(300).send({
            message: "Code is Invalid",
            data: {
                "isValid": false
            }
        })
    }
}

export const checkToken = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { token } = req.body;
        const validUser = await authService.checkToken(token);

        if (validUser) {
            res.status(200).send({
                message: 'valid User!'
            });
        }
        else {
            res.status(404).send({
                message: 'User Not Found!'
            });
        }
    } else {
        res.status(422).send({
            message: 'Validation Error!',
            data: errors,
        });
    }
}

export const resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const { password, token } = req.body;
        const actionState = await authService.resetPassword(password, token);

        if (actionState) {
            res.status(200).send({
                message: 'Password Reset Successfully!'
            });
        }
        else {
            res.status(404).send({
                message: 'Password Could Not Reset At The Moment!'
            });
        }
    } else {
        res.status(422).send({
            message: 'Validation Error!',
            data: errors,
        });
    }
}
