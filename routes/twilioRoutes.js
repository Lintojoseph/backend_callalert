const express = require('express')
const router = express.Router()
const twilioController = require('../controllers/twilioController')

router.get('/call-response', twilioController.callResponse)
router.post('/call-status', twilioController.callStatus)
router.post('/test-call', twilioController.testCall);
module.exports = router;