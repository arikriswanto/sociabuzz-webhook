if (!global.donationQueue) {
  global.donationQueue = [];
}

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "";
const API_SECRET    = process.env.API_SECRET || "";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const token =
      req.headers["x-webhook-token"] ||
      req.headers["x-sociabuzz-token"] ||
      (req.headers["authorization"] || "").replace("Bearer ", "") ||
      req.query.token ||
      (req.body && req.body.token) ||
      "";

    //if (WEBHOOK_TOKEN && token !== WEBHOOK_TOKEN) {
      //return res.status(403).json({ error: "Invalid token" });
    //}

    const body = req.body || {};
    const donation = {
      supporter_name: body.supporter_name || body.name || "Anonymous",
      amount:         body.amount || body.donation_amount || 0,
      message:        body.message || body.support_message || "",
    };

    global.donationQueue.push(donation);
    if (global.donationQueue.length > 200) {
      global.donationQueue = global.donationQueue.slice(-200);
    }

    console.log(`[donations] Received: ${donation.supporter_name} — Rp${donation.amount}`);
    return res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    const secret = req.query.secret || req.headers["x-api-secret"] || "";
    if (API_SECRET && secret !== API_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!global.donationQueue || global.donationQueue.length === 0) {
      return res.status(200).json({ hasNewDonation: false });
    }

    const donation = global.donationQueue.shift();
    return res.status(200).json({
      hasNewDonation: true,
      donatorName:    donation.supporter_name || "Anonymous",
      amount:         donation.amount || 0,
      message:        donation.message || "",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
