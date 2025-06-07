
const { google } = require('googleapis')
const { OAuth2Client } = require('google-auth-library')

async function listEvents(accessToken, timeMin, timeMax) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({ access_token: accessToken,refresh_token: refreshToken })

  
    // Ensure token is valid
    await oauth2Client.getAccessToken()
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

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
    try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'UTC'
    })

    // Filter out all-day events and cancelled events
    const validEvents = response.data.items.filter(event => {
      return event.status !== 'cancelled' && 
             event.start && 
             (event.start.dateTime || event.start.date)
    })

    console.log(`[CALENDAR] Found ${validEvents.length} valid events`)
    return validEvents
  } catch (error) {
     console.error('Error listing calendar events:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { listEvents }