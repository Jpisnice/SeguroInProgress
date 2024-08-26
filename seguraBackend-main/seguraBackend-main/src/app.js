import express from 'express'
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import customerRoutes from './customer/customer.route.js';
import userRoutes from './user/user.route.js';
import authRoutes from './auth/auth.route.js';
import adminRoutes from './admin/admin.route.js';
import vendorRoutes from './vendor/vendor.route.js';
import communicationRoutes from './commication/communication.route.js';
import { getInvoice } from './vendor/vendor.service.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
process.env.TZ = "Pacific/Auckland"
app.use(cors())

app.use(express.json())

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(join(__dirname, '../uploads')));


app.use('/customer', customerRoutes)
app.use('/user', userRoutes)
app.use('/', authRoutes)
app.use('/admin', adminRoutes)
app.use('/vendor', vendorRoutes)
app.use('/', communicationRoutes)

// getInvoice();

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something went wrong!')
})


const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log('Running on port ' + PORT)
})