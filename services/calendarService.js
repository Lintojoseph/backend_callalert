
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
const moment = require('moment-timezone') // Add this import

async function listEvents(accessToken, timeMin, timeMax) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    // Format times correctly for Google API
    const timeMinISO = moment(timeMin).tz('Asia/Kolkata').format()
    const timeMaxISO = moment(timeMax).tz('Asia/Kolkata').format()
    
    console.log(`[CALENDAR] Fetching events from ${timeMinISO} to ${timeMaxISO}`)
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'Asia/Kolkata'
    })

    // Filter valid events
    const validEvents = (response.data.items || []).filter(event => {
      return event.status !== 'cancelled' && 
             event.start && 
             event.start.dateTime
    })

    console.log(`[CALENDAR] Found ${validEvents.length} valid events`)
    
    // Detailed logging
    validEvents.forEach(event => {
      const start = moment(event.start.dateTime).tz('Asia/Kolkata')
      console.log(`[CALENDAR] Event: "${event.summary || 'No title'}" at ${start.format('DD MMM, hh:mm a')}`)
    })

    return validEvents
  } catch (error) {
    console.error('Calendar API error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    return []
  }
}

module.exports = { listEvents }