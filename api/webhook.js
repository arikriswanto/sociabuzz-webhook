// ============================================================
// /api/webhook — Sociabuzz webhook receiver
// Sociabuzz POST donation data ke sini setiap ada donasi masuk
// ============================================================

// In-memory queue — persists selama Vercel instance warm
// Untuk production heavy traffic, ganti ke Upstash Redis
if (!global.donationQueue) {
  global.donationQueue = [];
}

// Set token lo di Vercel Environment Variables: WEBHOOK_TOKEN
const EXPECTED_TOKEN = process.env.WEBHOOK_TOKEN || "";

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify webhook token dari Sociabuzz
  const token = req.headers["x-webhook-token"] || req.query.token || "";
  if (EXPECTED_TOKEN && token !== EXPECTED_TOKEN) {
    console.log("[webhook] Token mismatch — rejected");
    return res.status(403).json({ error: "Invalid token" });
  }

  try {
    const body = req.body;
    
    // Sociabuzz typically sends: supporter_name, amount, message, etc.
    const donation = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      supporter_name: body.supporter_name || body.name || "Anonymous",
      amount: body.amount || body.donation_amount || 0,
      message: body.message || body.support_message || "",
      currency: body.currency || "IDR",
      raw: body, // simpan payload asli juga
    };

    global.donationQueue.push(donation);
    console.log(`[webhook] Donation received: ${donation.supporter_name} — Rp${donation.amount}`);

    // Cap queue size biar ga memory leak (max 200 pending)
    if (global.donationQueue.length > 200) {
      global.donationQueue = global.donationQueue.slice(-200);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
