// const jwt = require('jsonwebtoken')
// const User = require('../models/User')

// module.exports = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '')
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' })
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     const user = await User.findById(decoded.id)

//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' })
//     }

//     req.user = user
//     next()
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' })
//   }
// }
const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async (req, res, next) => {
  try {
     if (req.method === 'GET' && req.body) {
      return res.status(400).json({ message: 'GET requests should not have a body' });
    }
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Find user
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    
    res.status(500).json({ message: 'Server error' })
  }
}