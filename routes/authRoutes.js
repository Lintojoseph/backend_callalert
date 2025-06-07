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
router.get('/reauth-required', authMiddleware, authController.requireReauth);
// router.get('/reauth', authMiddleware, (req, res) => {
//   // Force re-authentication with consent
//   const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
//     client_id: process.env.GOOGLE_CLIENT_ID,
//     redirect_uri: process.env.GOOGLE_CALLBACK_URL,
//     response_type: 'code',
//     scope: 'profile email https://www.googleapis.com/auth/calendar.readonly',
//     access_type: 'offline',
//     prompt: 'consent',
//     state: req.user.id
//   })}`;
  
//   res.redirect(authUrl);
// });

module.exports = router;  