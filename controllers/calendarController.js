
const { google } = require('googleapis')
const User = require('../models/User');

// exports.getEvents = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Use the token from the request (might be refreshed by middleware)
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({
//       access_token: user.accessToken,
//       refresh_token: user.refreshToken
//     });

//     const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
//     const now = new Date();
//     const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

//     const response = await calendar.events.list({
//       calendarId: 'primary',
//       timeMin: now.toISOString(),
//       timeMax: oneWeekLater.toISOString(),
//       maxResults: 10,
//       singleEvents: true,
//       orderBy: 'startTime',
//     });

//     // Filter out cancelled events
//     const validEvents = response.data.items.filter(event => 
//       event.status !== 'cancelled'
//     );

//     res.json({ events: validEvents });
//   } catch (error) {
//     console.error('Error fetching calendar events:', error);
    
//     let status = 500;
//     let message = 'Error fetching calendar events';
    
//     if (error.code === 401 || error.response?.status === 401) {
//       status = 401;
//       message = 'Google authentication expired. Please re-login.';
//     }
    
//     res.status(status).json({ 
//       message,
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }
exports.getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const now = new Date();
    
    // Extend time range to 30 days
    const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: later.toISOString(),
      maxResults: 50,  // Increase max results
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'UTC'  // Explicitly set timezone
    });

    // Improved event filtering
    const validEvents = response.data.items.filter(event => {
      return event.status !== 'cancelled' && 
             event.start && 
             (event.start.dateTime || event.start.date);
    });

    res.json({ events: validEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    // More detailed error responses
    let status = 500;
    let message = 'Error fetching calendar events';
    
    if (error.code === 401) {
      status = 401;
      message = 'Google authentication expired. Please re-login.';
    }
    else if (error.code === 403) {
      status = 403;
      message = 'Calendar API not enabled. Please contact support.';
    }
    
    res.status(status).json({ 
      message,
      detailedError: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};