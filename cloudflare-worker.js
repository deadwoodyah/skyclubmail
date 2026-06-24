/**
 * Cloudflare Email Worker untuk RichMail
 * 
 * CARA SETUP:
 * 1. Buka Cloudflare Dashboard -> richmail.web.id
 * 2. Klik "Email" -> "Email Routing" -> "Email Workers"
 * 3. Klik "Create" -> Beri nama "richmail-worker"
 * 4. Copy-paste code ini
 * 5. Klik "Save and Deploy"
 * 6. Kembali ke Email Routing -> Routes
 * 7. Klik "Catch-all" -> Action: "Send to Worker" -> Pilih "richmail-worker"
 * 8. Save
 * 
 * SELESAI! Semua email ke @richmail.web.id akan diterima oleh app.
 */

export default {
  async email(message, env, ctx) {
    // URL app Anda di Render
    const WEBHOOK_URL = "https://richmail.onrender.com/webhook/email";
    const WEBHOOK_SECRET = "richmail-secret-key-2026";

    // Baca email body
    const rawEmail = await new Response(message.raw).text();
    
    // Parse headers sederhana
    let subject = message.headers.get("subject") || "(No Subject)";
    let from = message.from || "unknown";
    let to = message.to || "unknown";
    let date = message.headers.get("date") || new Date().toISOString();

    // Pisahkan body dari headers
    let body = "";
    let html = "";
    const headerEnd = rawEmail.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const content = rawEmail.substring(headerEnd + 4);
      if (content.includes("<html") || content.includes("<div") || content.includes("<p>")) {
        html = content;
        body = content.replace(/<[^>]*>/g, "").trim();
      } else {
        body = content;
      }
    }

    // Kirim ke webhook app
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          from: from,
          to: to,
          subject: subject,
          text: body,
          html: html,
          date: date,
        }),
      });

      if (!response.ok) {
        console.log(`Webhook failed: ${response.status}`);
        // Forward ke email backup jika webhook gagal (opsional)
        // await message.forward("backup@gmail.com");
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  },
};
