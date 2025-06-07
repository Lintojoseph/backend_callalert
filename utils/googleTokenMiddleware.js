const { OAuth2Client } = require('google-auth-library')


module.exports = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) return next()
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    })
    
    // Refresh token if needed
    const { token } = await oauth2Client.getAccessToken()
    
    // Update user if token was refreshed
    if (token && token !== user.accessToken) {
      user.accessToken = token
      await user.save()
      console.log(`Refreshed Google token for ${user.email}`)
    }
    
    next()
  } catch (error) {
    console.error('Token validation failed:', error)
    res.status(401).json({ 
      message: 'Google authentication expired. Please re-login.',
      code: 'GOOGLE_AUTH_EXPIRED'
    })
  }
}