
const cron = require('node-cron')
const { listEvents } = require('./calendarService')
const { makeCall } = require('./twilioService')
const User = require('../models/User')
const { OAuth2Client } = require('google-auth-library')

// async function getUserWithRefreshedToken(user) {
//   const oauth2Client = new OAuth2Client(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET
//   )
  
//   oauth2Client.setCredentials({
//     access_token: user.accessToken,
//     refresh_token: user.refreshToken
//   })

//   try {
//     const { token } = await oauth2Client.getAccessToken()
//     if (token && token !== user.accessToken) {
//       user.accessToken = token
//       await user.save()
//       console.log(`Refreshed token for ${user.email}`)
//     }
//     return user
//   } catch (error) {
//     console.error(`Token refresh failed for ${user.email}:`, error)
//     return null
//   }
// }

// function setupCalendarChecks() {
//   cron.schedule('* * * * *', async () => {
//     try {
//       const users = await User.find({ 
//         phoneNumber: { $exists: true, $ne: null },
//         accessToken: { $exists: true }
//       })
      
//       for (const user of users) {
//         try {
//           const refreshedUser = await getUserWithRefreshedToken(user)
//           if (!refreshedUser) continue
          
//           const now = new Date()
//           const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)
          
//           const events = await listEvents(refreshedUser.accessToken, now, fiveMinutesLater)
          
//           if (events.length > 0 && (!user.lastNotifiedEvent || user.lastNotifiedEvent !== events[0].id)) {
//             const event = events[0]
//             const message = `Reminder: You have "${event.summary}" starting at ${new Date(event.start.dateTime).toLocaleTimeString()}.`
            
//             await makeCall(user.phoneNumber, message)
//             user.lastNotifiedEvent = event.id
//             await user.save()
            
//             console.log(`Call initiated for ${user.email} about "${event.summary}"`)
//           }
//         } catch (userError) {
//           console.error(`Error processing user ${user.email}:`, userError)
//         }
//       }
//     } catch (error) {
//       console.error('Error in cron job:', error)
//     }
//   })
// }

// module.exports = { setupCalendarChecks }
// function setupCalendarChecks() {
//   cron.schedule('* * * * *', async () => {
//     try {
//       const users = await User.find({ 
//         phoneNumber: { $exists: true, $ne: null },
//         accessToken: { $exists: true }
//       });
      
//       for (const user of users) {
//         try {
//           const refreshedUser = await getUserWithRefreshedToken(user);
//           if (!refreshedUser) continue;
          
//           const now = new Date();
//           const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
          
//           // Add buffer to catch events starting soon
//           const fiveMinutesEarlier = new Date(now.getTime() - 5 * 60 * 1000);
          
//           const events = await listEvents(
//             refreshedUser.accessToken, 
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
//             let eventTime = 'soon';
            
//             try {
//               if (nextEvent.start.dateTime) {
//                 const startDate = new Date(nextEvent.start.dateTime);
//                 eventTime = startDate.toLocaleTimeString([], {
//                   hour: '2-digit', 
//                   minute: '2-digit'
//                 });
//               }
//             } catch (e) {
//               console.error('Time formatting error:', e);
//             }

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
async function getUserWithRefreshedToken(user) {
  // Skip if no refresh token
  if (!user.refreshToken) {
    console.error(`No refresh token for ${user.email}. Requires re-authentication.`);
    user.tokenInvalid = true;
    await user.save();
    return null;
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens
    user.accessToken = credentials.access_token;
    if (credentials.refresh_token) {
      user.refreshToken = credentials.refresh_token;
    }
    
    await user.save();
    console.log(`Refreshed token for ${user.email}`);
    return user;
  } catch (error) {
    console.error(`Token refresh failed for ${user.email}:`, error);
    
    // Handle specific errors
    if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
      console.error(`Refresh token revoked for ${user.email}. Requires re-authentication.`);
      user.tokenInvalid = true;
      await user.save();
    }
    
    return null;
  }
}
function setupCalendarChecks() {
  cron.schedule('* * * * *', async () => {
    try {
    //   const users = await User.find({ 
    //     phoneNumber: { $exists: true, $ne: null },
    //     accessToken: { $exists: true }
    //   });
     const users = await User.find({ 
      phoneNumber: { $exists: true, $ne: null },
      tokenInvalid: { $ne: true }, // Skip invalid users
      refreshToken: { $exists: true, $ne: null } // Only users with refresh tokens
    });
      
      for (const user of users) {
        try {
          const refreshedUser = await getUserWithRefreshedToken(user);
          if (!refreshedUser) continue;
          
          const now = new Date();
          const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
          const fiveMinutesLater = new Date(utcNow.getTime() + 5 * 60 * 1000);
          
          // Add buffer to catch events
          const fiveMinutesEarlier = new Date(utcNow.getTime() - 5 * 60 * 1000);
          
          const events = await listEvents(
            refreshedUser.accessToken,
            refreshedUser.refreshToken, 
            fiveMinutesEarlier,
            fiveMinutesLater
          );
          
          // Add detailed logging
          console.log(`[Cron] Checking events for ${user.email}`);
          console.log(`Time range: ${fiveMinutesEarlier.toISOString()} to ${fiveMinutesLater.toISOString()}`);
          console.log(`Found ${events.length} events`);
          
          if (events.length > 0) {
            events.forEach(event => {
              console.log(`- Event: ${event.summary || 'No title'} at ${event.start.dateTime}`);
            });
          }

          // Process only the next immediate event
          const nextEvent = events[0];
          if (nextEvent && (!user.lastNotifiedEvent || user.lastNotifiedEvent !== nextEvent.id)) {
            const eventSummary = nextEvent.summary || 'An upcoming event';
            
            // Convert event time to local time
            const eventStart = new Date(nextEvent.start.dateTime);
            const localTime = new Date(eventStart.getTime() + (eventStart.getTimezoneOffset() * 60000));
            const eventTime = localTime.toLocaleTimeString([], {
              hour: '2-digit', 
              minute: '2-digit'
            });

            const message = `Reminder: You have "${eventSummary}" starting at ${eventTime}.`;
            console.log(`Preparing call with message: ${message}`);
            
            await makeCall(user.phoneNumber, message);
            user.lastNotifiedEvent = nextEvent.id;
            await user.save();
            
            console.log(`Call initiated for ${user.email}`);
          }
        } catch (userError) {
          console.error(`Error processing user ${user.email}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
}
module.exports = { setupCalendarChecks }