// require('dotenv').config()
// const express = require('express')
// const mongoose = require('mongoose')
// const passport = require('passport')
// const cors = require('cors')
// const authRoutes = require('./routes/authRoutes')
// const calendarRoutes = require('./routes/calendarRoutes')
// const twilioRoutes = require('./routes/twilioRoutes')
// const { setupCalendarChecks } = require('./services/cronService')
// const requestLogger = require('./middleware/requestLogger')
// require('./config/passport')
// const app = express()
// app.use(requestLogger)

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
// }));

// // Handle preflight requests
// app.options('*', cors());
// app.use(express.json())
// app.use(passport.initialize())

// // Database connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error('MongoDB connection error:', err))

// // Routes
// app.use('/auth', authRoutes)
// app.use('/api/calendar', calendarRoutes)
// app.use('/twilio', twilioRoutes)

// // Start cron job
// setupCalendarChecks()

// const PORT = process.env.PORT || 3001
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const calendarRoutes = require('./routes/calendarRoutes')
const twilioRoutes = require('./routes/twilioRoutes')
const { setupCalendarChecks } = require('./services/cronService')
const requestLogger = require('./middleware/requestLogger')
require('./config/passport')
const app = express()
app.use(requestLogger)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Includes OPTIONS
}));
// app.use(express.json())
app.use((req, res, next) => {
  // Only parse JSON for non-GET requests
  if (req.method === 'GET') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(passport.initialize())

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err))
app.enable('trust proxy');
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
});
// Routes
app.use('/auth', authRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/twilio', twilioRoutes)

// Start cron job
setupCalendarChecks()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)) 