const nodemailer = require("nodemailer");
const config = require("config");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: config.get("email_user"),
    pass: config.get("email_pass"),
    clientId: config.get("gmail_api_clientID"),
    clientSecret: config.get("gmail_api_client_secret"),
    refreshToken: config.get("gmail_refresh_token"),
    accessToken: config.get("gmail_access_token"),
    expires: config.get("gmail_expires"),
  },
});

function sendConfirmationEmail(code, email) {
  return sendEmail({
    from: "Rob Taylor",
    to: email,
    subject: "Confirm your Email - Rob Taylor's Portfolio",
    html: `<p>Your confirmation code is: <b>${code}</b></p>`,
  });
}

function sendPasswordResetRequest(code, email) {
  return sendEmail({
    from: "Rob Taylor",
    to: email,
    subject: "Reset your Password - Rob Taylor's Portfolio",
    html: `<p>Your confirmation code is: <b>${code}</b></p>
           <p>Enter the above code to confirm that it is you, however this code will expire in 30 minutes</p>`,
  });
}

async function sendEmail(params) {
  return transporter.sendMail(params);
}

function setGoogleToken(token) {
  googleToken = token;
  console.log(googleToken);
}

module.exports.sendPasswordResetRequest = sendPasswordResetRequest;
module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.sendEmail = sendEmail;
module.exports.setGoogleToken = setGoogleToken;
