const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)


// async function makeCall(phoneNumber, message) {
//   try {
//     // Ensure message is properly sanitized
//     const cleanMessage = message.replace(/undefined/g, 'an event');
//     const encodedMessage = encodeURIComponent(cleanMessage);
    
//     // Use HTTPS for Twilio URL
//     const responseUrl = `${process.env.BACKEND_URL.replace('http://', 'https://')}/twilio/call-response?message=${encodedMessage}`;
    
//     console.log(`Calling ${phoneNumber} with Twilio URL: ${responseUrl}`);
    
//     const call = await client.calls.create({
//       url: responseUrl,
//       to: phoneNumber,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       statusCallback: `${process.env.BACKEND_URL}/twilio/call-status`,
//       statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
//       statusCallbackMethod: 'POST'
//     });
    
//     return call.sid;
//   } catch (error) {
//     console.error('Twilio call error:', error);
//     throw error;
//   }
// }
async function makeCall(phoneNumber, message) {
  try {
    // Ensure message is clean
    const cleanMessage = message.replace(/undefined/g, 'an event');
    
    // Encode for URL safety
    const encodedMessage = encodeURIComponent(cleanMessage);
    
    // Use HTTPS - Twilio requires secure URLs
    const httpsBackendUrl = process.env.BACKEND_URL.replace('http://', 'https://');
    const responseUrl = `${httpsBackendUrl}/twilio/call-response?message=${encodedMessage}`;
    
    console.log(`Initiating call to ${phoneNumber} with URL: ${responseUrl}`);
    
    const call = await client.calls.create({
      url: responseUrl,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      method: 'GET',
      statusCallback: `${httpsBackendUrl}/twilio/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });
    
    console.log(`Call SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error('Twilio call error:', error);
    throw error;
  }
}
function getCallResponse(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say voice="alice">${message}</Say>
    <Pause length="2"/>
    <Say voice="alice">This is an automated reminder from your Google Calendar.</Say>
  </Response>`
}
module.exports = { makeCall, getCallResponse }