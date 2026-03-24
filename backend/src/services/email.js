import { Resend } from "resend";
import { supabase } from "./supabase.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || "noreply@greendraw.local";

export const logEmail = async ({ recipientEmail, eventType, subject, body }) => {
  try {
    await supabase.from("email_logs").insert({
      recipient_email: recipientEmail,
      event_type: eventType,
      subject,
      body
    });

    if (resend) {
      await resend.emails.send({
        from,
        to: recipientEmail,
        subject,
        text: body
      });
    }
  } catch (error) {
    console.warn("Unable to send/log email event:", error.message);
  }
};
