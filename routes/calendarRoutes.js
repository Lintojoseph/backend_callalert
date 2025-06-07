const express = require('express')
const router = express.Router()
const calendarController = require('../controllers/calendarController')
const authMiddleware = require('../utils/authMiddleware')
const googleTokenMiddleware = require('../utils/googleTokenMiddleware')

router.get('/events', authMiddleware,googleTokenMiddleware, calendarController.getEvents)

module.exports = router;