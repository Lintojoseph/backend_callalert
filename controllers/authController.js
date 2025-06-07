const passport = require('passport')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
})

// exports.googleAuthCallback = passport.authenticate('google', {
//   failureRedirect: '/login',
//   session: false
// }), (req, res) => {
//   const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
//   res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`)
// }
exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false 
  }, (err, user) => {
    if (err || !user) {
      console.error('Google auth error:', err || 'No user returned');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    try {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      console.error('Token creation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
    }
  })(req, res, next);
};

// exports.getUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-accessToken -refreshToken')
//     res.json(user)
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' })
//   }
// }
exports.getUser = async (req, res) => {
  try {
    // Return user without sensitive data
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber
    }
    
    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// exports.savePhoneNumber = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { phoneNumber: req.body.phoneNumber },
//       { new: true }
//     )
//     res.json(user)
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' })
//   }
// }
exports.savePhoneNumber = async (req, res) => {
  try {
    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!req.body.phoneNumber || !phoneRegex.test(req.body.phoneNumber)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use E.164 format (+1234567890)' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phoneNumber: req.body.phoneNumber },
      { new: true, runValidators: true }
    ).select('-accessToken -refreshToken'); // Exclude sensitive data
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Save phone number error:', error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
}