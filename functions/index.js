const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const nodemailer = require("nodemailer");

admin.initializeApp();

/**
 * Sends a verification email using Nodemailer.
 * NOTE: Transporter is initialized inside the function for resilience.
 */
exports.sendVerificationEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Initialize config and transporter inside the function request.
    // This prevents container startup errors if config is not yet available.
    const gmailEmail = functions.config().gmail.email;
    const gmailPassword = functions.config().gmail.password;

    if (!gmailEmail || !gmailPassword) {
      const errorMsg = "Gmail credentials are not configured on the server.";
      console.error("Configuration Error:", errorMsg);
      const serverError = "Server configuration error. Contact support.";
      return res.status(500).json({success: false, error: serverError});
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {email, code} = req.body;

    if (!email || !code) {
      const errorMsg = "Email and code are required.";
      return res.status(400).json({success: false, error: errorMsg});
    }

    const mailOptions = {
      from: `"Trading Journal" <${gmailEmail}>`,
      to: email,
      subject: "Your Trading Journal Verification Code",
      html: `
        <div
          style="font-family: sans-serif; text-align: center; padding: 20px;"
        >
          <h2>Welcome to Your Trading Journal!</h2>
          <p>Here is your 4-digit verification code:</p>
          <p
            style="font-size: 36px; font-weight: bold; letter-spacing: 8px;"
          >
            ${code}
          </p>
          <p>Enter this code to complete your sign-up.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({success: true});
    } catch (error) {
      console.error("Nodemailer Error:", error.toString());
      const errorMsg = "Failed to send email.";
      return res.status(500).json({success: false, error: errorMsg});
    }
  });
});

