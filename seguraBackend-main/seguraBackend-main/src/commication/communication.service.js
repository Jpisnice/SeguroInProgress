// var nodemailer = require('nodemailer');
import nodemailer from 'nodemailer'
import * as qr from 'qrcode'
import pool from '../../configs/database.js';
import crypto from 'crypto';
import fs from 'fs';

// Function to generate a random CID
const generateCID = () => {
  return crypto.randomBytes(8).toString('hex');
};

var transporter = nodemailer.createTransport({
  host: "email-smtp.ap-southeast-2.amazonaws.com",
  port: 465,
  secure: true,
  requireTLS: true,
  auth: {
    user: "AKIAUHLLLGG2GMDP6J2C",
    pass: "BNdxAAPjFx1UnAaO2TNBAUL/3szsYC932wabY94Qjret",
  },
});

const cid = generateCID(); // Generate a unique CID for the image

async function generateQRCode(value, errorCorrectionLevel = 'L') {
  const uploadsFolder = 'uploads'; // Update with the actual path

  try {
    const qrCodeBuffer = await qr.toBuffer(value, { errorCorrectionLevel });
    const qrCodeBase64 = qrCodeBuffer.toString('base64');

    // Save the QR code image to a file
    const filePath = `${uploadsFolder}/${value.slice(0, 20)}.png`;
    fs.writeFileSync(filePath, qrCodeBuffer);

    return {
      filePath,
      qrCodeBase64,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export const sendEmail = async (emailId, subject, body, qrCode = '') => {
  try {
    var mailOptions = {}
    if (qrCode !== '') {
      await generateQRCode(qrCode, 'H');
      mailOptions = {
        from: 'access@seguro.co.nz',
        to: emailId,
        subject: subject,
        html: body + '<img height="100" width="100" alt="" src="https://ci3.googleusercontent.com/meips/ADKq_NYjpb6_Ty4VYitf1j5Cqq1NT2t8j5N6fIGXc_X6qCp2Teef-rlkrBtDSqP_qI3GZMpj8rlzT_eiEeIgrVCUATk3QH3DYG9eWQW_E_pO0HIQILC5kqZzhKTsPPJKUCdRXJ1oEFB2e-_N=s0-d-e1-ft#http://segurotest-1449695445.ap-southeast-2.elb.amazonaws.com/api/uploads/logo.png" />',
        attachments: [
          {
            // file on disk as an attachment
            filename: `${qrCode.slice(0, 20)}.png`,
            href: `http://segurotest-1449695445.ap-southeast-2.elb.amazonaws.com/api/uploads/${qrCode.slice(0, 20)}.png` // stream this file
          },
        ]
      };
    } else if (subject === "Seguro (Forgot Password):") {
      const [userData] = await pool.query('SELECT token FROM users WHERE email = ? AND isactive=1 AND isdeleted=0', [emailId]);
      var resetLink = `<p><b>Link:</b> https://access.seguro.co.nz/resetPassword/${userData[0].token}</p>`;

      if (userData.length === 1) {
        mailOptions = {
          from: 'access@seguro.co.nz',
          to: emailId,
          subject: subject,
          html: body + resetLink + '<img height="100" width="100" alt="" src="https://ci3.googleusercontent.com/meips/ADKq_NYjpb6_Ty4VYitf1j5Cqq1NT2t8j5N6fIGXc_X6qCp2Teef-rlkrBtDSqP_qI3GZMpj8rlzT_eiEeIgrVCUATk3QH3DYG9eWQW_E_pO0HIQILC5kqZzhKTsPPJKUCdRXJ1oEFB2e-_N=s0-d-e1-ft#http://segurotest-1449695445.ap-southeast-2.elb.amazonaws.com/api/uploads/logo.png" />'
        };
      }
    }
    else {
      mailOptions = {
        from: 'access@seguro.co.nz',
        to: emailId,
        subject: subject,
        html: body + '<img height="100" width="100" alt="" src="https://ci3.googleusercontent.com/meips/ADKq_NYjpb6_Ty4VYitf1j5Cqq1NT2t8j5N6fIGXc_X6qCp2Teef-rlkrBtDSqP_qI3GZMpj8rlzT_eiEeIgrVCUATk3QH3DYG9eWQW_E_pO0HIQILC5kqZzhKTsPPJKUCdRXJ1oEFB2e-_N=s0-d-e1-ft#http://segurotest-1449695445.ap-southeast-2.elb.amazonaws.com/api/uploads/logo.png" />'
      };
    }



    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return {
      success: true,
      message: 'Email sent successfully6',
      info: info.response,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message,
    };
  }
};

export const emailTemplate = async (type, id = '') => {
  try {
    if (type == "new_vendor") {
      const [template] = await pool.query('SELECT * from email_template WHERE type = ?', [type])
      console.log(template[0])
      return template[0]
    } else {
      const [template] = await pool.query('SELECT * from email_template WHERE type = ? AND vendorid = ?', [type, id])
      console.log(template[0])
      return template[0]
    }

  } catch (err) {
    console.log(err)
  }
};

export const updateEmailTemplate = async (subject, body, type, id = '') => {
  if (type == "new_vendor") {
    await pool.query('UPDATE `email_template` SET `subject`=?,`body`=? WHERE type = ?', [subject, body, type])
    return emailTemplate(type)
  } else {

    await pool.query('UPDATE `email_template` SET `subject`=?,`body`=? WHERE type = ? AND vendorid = ?', [subject, body, type, id])
    return emailTemplate(type, id)
  }

};