const nodemailer = require("nodemailer");
const config = require("config");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: config.get("email_user"),
    pass: config.get("email_pass"),
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

function sendPasswordResetRequest(email) {
  return sendEmail({
    from: "Rob Taylor",
    to: email,
    subject: "Reset your Password - Rob Taylor's Portfolio",
    html: `<p>Click the link below to reset your password</p><a href="localhost:3000/recover">localhost:3000/recover</a>`,
  });
}

async function sendEmail(params) {
  return transporter.sendMail(params);
}

module.exports.sendPasswordResetRequest = sendPasswordResetRequest;
module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.sendEmail = sendEmail;
