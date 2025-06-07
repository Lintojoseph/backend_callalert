// const express = require('express')
// const router = express.Router()
// const authController = require('../controllers/authController')
// const authMiddleware = require('../utils/authMiddleware')

// router.get('/google', authController.googleAuth)
// router.get('/google/callback', authController.googleAuthCallback)

// router.get('/me', authMiddleware, authController.getUser)
// router.post('/phone', authMiddleware, authController.savePhoneNumber)

// module.exports = router
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../utils/authMiddleware')

router.get('/google', authController.googleAuth)
router.get('/google/callback', authController.googleAuthCallback)
router.get('/me', authMiddleware, authController.getUser)
router.post('/phone', authMiddleware, authController.savePhoneNumber)

module.exports = router;  