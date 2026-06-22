import { sendEmail } from "../utils/mailer.js";
import { getSql } from "../configs/db.js";

export const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({
        success: false,
        error: "Email required",
      });

    const sql = getSql();
    if (!sql) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
      });
    }

    await sql`
      INSERT INTO subscribers (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    // Send welcome email
await sendEmail({
  to: email,
  subject: "Welcome to Buddhimaan 🚀",
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Buddhimaan</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9; padding:30px 0;">
      <tr>
        <td align="center">

          <!-- Main Container -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

            <!-- Header -->
            <tr>
              <td align="center" style="background:linear-gradient(90deg,#4f46e5,#6366f1); padding:40px 20px;">
                <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:bold;">
                  🚀 Welcome to Buddhimaan
                </h1>
                <p style="margin:10px 0 0; color:#e0e7ff; font-size:16px;">
                  Your AI Journey Begins Now
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 30px; color:#333333; text-align:center;">

                <h2 style="margin:0 0 20px; font-size:22px; color:#111827;">
                  You're Officially Subscribed 🎉
                </h2>

                <p style="font-size:16px; line-height:1.6; margin:0 0 20px;">
                  Thank you for joining <strong>Buddhimaan</strong>.
                  Get ready to receive powerful AI insights, practical tools,
                  real-world strategies, and curated knowledge delivered straight to your inbox.
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 30px;">
                  We believe in <strong>high-value content only</strong>.
                  No spam. No noise. Just clarity.
                </p>

                <!-- Button -->
                <table cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#4f46e5" style="border-radius:6px;">
                      <a href="https://yourwebsite.com"
                         target="_blank"
                         style="display:inline-block; padding:14px 32px; font-size:16px; color:#ffffff; text-decoration:none; font-weight:bold;">
                        Explore Now →
                      </a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="height:1px; background-color:#e5e7eb;"></td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:25px; font-size:13px; color:#6b7280;">
                © 2026 Buddhimaan. All Rights Reserved.<br/><br/>
                Follow us on 
                <a href="https://twitter.com/Buddhimaan" target="_blank" style="color:#4f46e5; text-decoration:none;">Twitter</a> |
                <a href="https://www.linkedin.com/company/buddhimaan" target="_blank" style="color:#4f46e5; text-decoration:none;">LinkedIn</a>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `,
});

    res.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ success: false });
  }
};