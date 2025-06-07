
// const { google } = require('googleapis')
// const { OAuth2Client } = require('google-auth-library')

// async function listEvents(accessToken, timeMin, timeMax) {
//   const oauth2Client = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET
//   )
//   try{
//   oauth2Client.setCredentials({ access_token: accessToken,refresh_token: refreshToken })
  
  
//     // Ensure token is valid
//     await oauth2Client.getAccessToken()
    
//     const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // const response = await calendar.events.list({
    //   calendarId: 'primary',
    //   timeMin: timeMin.toISOString(),
    //   timeMax: timeMax.toISOString(),
    //   maxResults: 10,
    //   singleEvents: true,
    //   orderBy: 'startTime',
    // })

    // return response.data.items
    // const response = await calendar.events.list({
    //   calendarId: 'primary',
    //   timeMin: timeMin.toISOString(),
    //   timeMax: timeMax.toISOString(),
    //   maxResults: 10,
    //   singleEvents: true,
    //   orderBy: 'startTime',
    //   timeZone: 'UTC'
    // });

    // console.log(`[DEBUG] Calendar API request successful for time range: 
    //   ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
    
    // return response.data.items;
    
    
//   } catch (error) {
//      console.error('Error listing calendar events:', error.response?.data || error.message);
//     return [];
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
  
  // Set only the access token - refresh token not needed here
  oauth2Client.setCredentials({ access_token: accessToken })
    
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    console.log(`[CALENDAR] Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`)
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'Asia/Kolkata'  // Use user's timezone
    })

    // Filter out all-day events and cancelled events
    const validEvents = response.data.items.filter(event => {
      return event.status !== 'cancelled' && 
             event.start && 
             event.start.dateTime  // Only include events with specific times
    })

    console.log(`[CALENDAR] Found ${validEvents.length} valid events`)
    
    // Detailed event logging
    validEvents.forEach(event => {
      const start = new Date(event.start.dateTime)
      console.log(`[CALENDAR] Event: "${event.summary || 'No title'}" at ${start.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      })}`)
    })

    return validEvents
  } catch (error) {
    console.error('Error listing calendar events:', error.response?.data || error.message)
    return []
  }
}

module.exports = { listEvents }