// const { google } = require('googleapis')

// async function listEvents(accessToken, timeMin, timeMax) {
//   const oauth2Client = new google.auth.OAuth2()
//   oauth2Client.setCredentials({ access_token: accessToken })

//   const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

//   try {
//     const response = await calendar.events.list({
//       calendarId: 'primary',
//       timeMin: timeMin.toISOString(),
//       timeMax: timeMax.toISOString(),
//       maxResults: 10,
//       singleEvents: true,
//       orderBy: 'startTime',
//     })

//     return response.data.items
//   } catch (error) {
//     console.error('Error listing calendar events:', error)
//     return []
//   }
// }

// module.exports = { listEvents }
const { google } = require('googleapis')
const { OAuth2Client } = require('google-auth-library')

async function listEvents(accessToken, timeMin, timeMax) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({ access_token: accessToken })

  try {
    // Ensure token is valid
    await oauth2Client.getAccessToken()
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items
  } catch (error) {
    console.error('Error listing calendar events:', error)
    return []
  }
}

module.exports = { listEvents }