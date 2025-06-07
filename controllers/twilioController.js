const { getCallResponse } = require('../services/twilioService')

exports.callResponse = (req, res) => {
  const message = req.query.message || 'You have an upcoming event'
  const twiml = getCallResponse(message)
  res.type('text/xml')
  res.send(twiml)
}
//this new endpoint
// Add to twilioController.js
exports.callStatus = (req, res) => {
  const status = req.body.CallStatus;
  const callSid = req.body.CallSid;
  
  console.log(`Call status update: 
    SID: ${callSid}
    Status: ${status}
    To: ${req.body.To}
    From: ${req.body.From}
    Error: ${req.body.ErrorCode || 'None'}`);
  
  res.status(200).end();
};

// Add this to twilioController.js
exports.testCall = async (req, res) => {
  try {
    const user = await User.findOne({ email: 'your@email.com' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const message = 'This is a test call from the reminder system';
    const callSid = await makeCall(user.phoneNumber, message);
    
    res.json({ success: true, callSid });
  } catch (error) {
    console.error('Test call error:', error);
    res.status(500).json({ error: error.message });
  }
};