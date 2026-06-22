import nodemailer from "nodemailer";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // must be false for 587
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Buddhimaan 🚀" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};