const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter(a service which sends email)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate "less secure app" option in case of gmail
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Nachiketa Dhal <bnachiketa26@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions); // returns promise
};

module.exports = sendEmail;
