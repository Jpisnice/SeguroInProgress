import { validationResult } from "express-validator"
import * as communicationService from "./communication.service.js"

export const sendEmail = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { email, subject, body, qrCode = '' } = req.body
        const data = await communicationService.sendEmail(email, subject, body, qrCode)
        if (data) {
            res.status(200).send({
                message: "Email sent successfully",
                data: data
            })
        } else {
            res.status(400).send({
                message: "Failed sending mail",
            })
        }
    } else {
        res.status(400).send({
            message: "Invalid Input",
            data: errors
        })
    }
}

export const emailTemplate = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { type, id = '' } = req.body
        const data = await communicationService.emailTemplate(type, id)
        if (data) {
            res.status(200).send({
                message: "Templates fetched successfully",
                data: data
            })
        } else {
            res.status(400).send({
                message: "Failed sending mail",
            })
        }
    } else {
        res.status(400).send({
            message: "Invalid Input",
            data: errors
        })
    }
}

export const updateEmailTemplate = async (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        const { subject, body, type, id = '' } = req.body
        const data = await communicationService.updateEmailTemplate( subject, body, type, id)
        if (data) {
            res.status(200).send({
                message: "Template Updated successful",
                data: data
            })
        } else {
            res.status(400).send({
                message: "Failed to Update Template",
            })
        }
    } else {
        res.status(400).send({
            message: "Invalid Input",
            data: errors
        })
    }
}
