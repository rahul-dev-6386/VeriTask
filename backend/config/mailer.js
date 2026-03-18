import nodemailer from "nodemailer";

// nodemailer schema to send otp to user;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

export { transporter };
