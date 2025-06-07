
// const cron = require('node-cron')
// const { listEvents } = require('./calendarService')
// const { makeCall } = require('./twilioService')
// const User = require('../models/User')
// const { OAuth2Client } = require('google-auth-library')


// async function getUserWithRefreshedToken(user) {
//   // Skip if no refresh token
//   if (!user.refreshToken) {
//     console.error(`No refresh token for ${user.email}. Requires re-authentication.`);
//     user.tokenInvalid = true;
//     await user.save();
//     return null;
//   }

//   const oauth2Client = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET
//   );
  
//   oauth2Client.setCredentials({
//     access_token: user.accessToken,
//     refresh_token: user.refreshToken
//   });

//   try {
//     const { credentials } = await oauth2Client.refreshAccessToken();
    
//     // Update tokens
//     user.accessToken = credentials.access_token;
//     if (credentials.refresh_token) {
//       user.refreshToken = credentials.refresh_token;
//     }
    
//     await user.save();
//     console.log(`Refreshed token for ${user.email}`);
//     return user;
//   } catch (error) {
//     console.error(`Token refresh failed for ${user.email}:`, error);
    
//     // Handle specific errors
//     if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
//       console.error(`Refresh token revoked for ${user.email}. Requires re-authentication.`);
//       user.tokenInvalid = true;
//       await user.save();
//     }
    
//     return null;
//   }
// }
// function setupCalendarChecks() {
//   cron.schedule('* * * * *', async () => {
//     try {
//     //   const users = await User.find({ 
//     //     phoneNumber: { $exists: true, $ne: null },
//     //     accessToken: { $exists: true }
//     //   });
//      const users = await User.find({ 
//       phoneNumber: { $exists: true, $ne: null },
//       tokenInvalid: { $ne: true }, // Skip invalid users
//       refreshToken: { $exists: true, $ne: null } // Only users with refresh tokens
//     });
      
//       for (const user of users) {
//         try {
//           const refreshedUser = await getUserWithRefreshedToken(user);
//           if (!refreshedUser) continue;
          
//         //   const now = new Date();
//         //   const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
//         //   const fiveMinutesLater = new Date(utcNow.getTime() + 5 * 60 * 1000);
          
          
//         //   const fiveMinutesEarlier = new Date(utcNow.getTime() - 5 * 60 * 1000);
//         const now = new Date();
//         const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
//         const fiveMinutesEarlier = new Date(now.getTime() - 5 * 60 * 1000);
          
//           const events = await listEvents(
//             refreshedUser.accessToken,
//             refreshedUser.refreshToken, 
//             fiveMinutesEarlier,
//             fiveMinutesLater
//           );
          
//           // Add detailed logging
//           console.log(`[Cron] Checking events for ${user.email}`);
//           console.log(`Time range: ${fiveMinutesEarlier.toISOString()} to ${fiveMinutesLater.toISOString()}`);
//           console.log(`Found ${events.length} events`);
          
//           if (events.length > 0) {
//             events.forEach(event => {
//               console.log(`- Event: ${event.summary || 'No title'} at ${event.start.dateTime}`);
//             });
//           }

//           // Process only the next immediate event
//           const nextEvent = events[0];
//           if (nextEvent && (!user.lastNotifiedEvent || user.lastNotifiedEvent !== nextEvent.id)) {
//             const eventSummary = nextEvent.summary || 'An upcoming event';
            
//             // Convert event time to local time
//             const eventStart = new Date(nextEvent.start.dateTime);
//             const localTime = new Date(eventStart.getTime() + (eventStart.getTimezoneOffset() * 60000));
//             const eventTime = localTime.toLocaleTimeString([], {
//               hour: '2-digit', 
//               minute: '2-digit'
//             });

//             const message = `Reminder: You have "${eventSummary}" starting at ${eventTime}.`;
//             console.log(`Preparing call with message: ${message}`);
            
//             await makeCall(user.phoneNumber, message);
//             user.lastNotifiedEvent = nextEvent.id;
//             await user.save();
            
//             console.log(`Call initiated for ${user.email}`);
//           }
//         } catch (userError) {
//           console.error(`Error processing user ${user.email}:`, userError);
//         }
//       }
//     } catch (error) {
//       console.error('Error in cron job:', error);
//     }
//   });
// }
// module.exports = { setupCalendarChecks }
const cron = require('node-cron')
const { listEvents } = require('./calendarService')
const { makeCall } = require('./twilioService')
const User = require('../models/User')
const { OAuth2Client } = require('google-auth-library')
const pLimit = require('p-limit')

// Limit concurrent user processing to prevent overload
const userProcessingLimit = pLimit(3)

// Track if job is running to prevent overlaps
let isJobRunning = false

async function getUserWithRefreshedToken(user) {
  if (!user.refreshToken) {
    console.error(`[CRON] No refresh token for ${user.email}`)
    user.tokenInvalid = true
    await user.save()
    return null
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  // Only need refresh token for refreshing
  oauth2Client.setCredentials({
    refresh_token: user.refreshToken
  })

  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    // Update tokens
    user.accessToken = credentials.access_token
    // Keep existing refresh token if new one isn't provided
    user.refreshToken = credentials.refresh_token || user.refreshToken
    
    await user.save()
    console.log(`[CRON] Refreshed token for ${user.email}`)
    return user
  } catch (error) {
    console.error(`[CRON] Token refresh failed for ${user.email}:`, error)
    
    if (error.response?.data?.error === 'invalid_grant') {
      console.error(`[CRON] Refresh token revoked for ${user.email}`)
      user.tokenInvalid = true
      await user.save()
    }
    
    return null
  }
}

async function processUser(user) {
  try {
    const refreshedUser = await getUserWithRefreshedToken(user)
    if (!refreshedUser) return

    const now = new Date()
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)
    const fiveMinutesEarlier = new Date(now.getTime() - 5 * 60 * 1000)
    
    console.log(`[CRON] Checking events for ${user.email}`)
    console.log(`[CRON] Time range: ${fiveMinutesEarlier.toISOString()} to ${fiveMinutesLater.toISOString()}`)
    
    const events = await listEvents(
      refreshedUser.accessToken,
      fiveMinutesEarlier,
      fiveMinutesLater
    )
    
    console.log(`[CRON] Found ${events.length} events for ${user.email}`)
    
    if (events.length > 0) {
      events.forEach(event => {
        console.log(`[CRON] - Event: ${event.summary || 'No title'} at ${event.start.dateTime}`)
      })

      // Find the soonest upcoming event
      const nextEvent = events.reduce((soonest, event) => {
        const eventStart = new Date(event.start.dateTime || event.start.date)
        return (!soonest || eventStart < new Date(soonest.start.dateTime)) ? event : soonest
      }, null)

      if (nextEvent) {
        const eventSummary = nextEvent.summary || 'An upcoming event'
        const eventStart = new Date(nextEvent.start.dateTime || nextEvent.start.date)
        
        // Format time in user's local time (India timezone)
        const eventTime = eventStart.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })

        const message = `Reminder: You have "${eventSummary}" starting at ${eventTime}.`
        
        // Debug event time
        console.log(`[CRON] Event time: UTC ${eventStart.toISOString()}, Local ${eventTime}`)

        // Only proceed if event is within 5 minutes
        const timeDiff = (eventStart - now) / (1000 * 60)  // minutes
        if (timeDiff <= 5 && timeDiff >= 0) {
          console.log(`[CRON] Preparing call for ${user.email}: ${message}`)
          await makeCall(user.phoneNumber, message)
          user.lastNotifiedEvent = nextEvent.id
          await user.save()
          console.log(`[CRON] Call initiated for ${user.email}`)
        } else {
          console.log(`[CRON] Event not within 5 minutes (${timeDiff.toFixed(1)} min)`)
        }
      }
    }
  } catch (userError) {
    console.error(`[CRON] Error processing user ${user.email}:`, userError)
  }
}

function setupCalendarChecks() {
  cron.schedule('* * * * *', async () => {
    if (isJobRunning) {
      console.log('[CRON] Previous job still running, skipping this execution')
      return
    }
    
    isJobRunning = true
    console.log('[CRON] Starting scheduled job')
    
    try {
      const users = await User.find({ 
        phoneNumber: { $exists: true, $ne: null },
        tokenInvalid: { $ne: true },
        refreshToken: { $exists: true, $ne: null }
      })
      
      console.log(`[CRON] Found ${users.length} users to process`)
      
      // Process users with concurrency control
      await Promise.all(users.map(user => 
        userProcessingLimit(() => processUser(user))
      )
    )
    } catch (error) {
      console.error('[CRON] Job processing error:', error)
    } finally {
      isJobRunning = false
      console.log('[CRON] Job completed')
    }
  })
}

module.exports = { setupCalendarChecks }