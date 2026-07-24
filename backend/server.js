const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/chits', require('./routes/chitRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/fpayment', require('./routes/fpaymentRoutes'));
app.use('/api/fpayment-teams', require('./routes/fpaymentTeamRoutes'));
app.use('/api/fpayment-customers', require('./routes/fpaymentCustomerRoutes'));
app.use('/api/payment-schemes', require('./routes/paymentSchemeRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
