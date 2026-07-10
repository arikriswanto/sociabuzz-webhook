// ============================================================
// /api/check-donations — Roblox polling endpoint
// Roblox HttpService GET ke sini setiap beberapa detik
// Returns pending donations lalu clear dari queue
// ============================================================

if (!global.donationQueue) {
  global.donationQueue = [];
}

// Optional: secret key biar bukan sembarang orang bisa poll
const API_SECRET = process.env.API_SECRET || "";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify API secret (opsional — set di Vercel env vars)
  const secret = req.query.secret || req.headers["x-api-secret"] || "";
  if (API_SECRET && secret !== API_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Ambil semua pending donations, lalu clear queue
  const pending = [...global.donationQueue];
  global.donationQueue = [];

  return res.status(200).json({
    donations: pending.map((d) => ({
      id: d.id,
      supporter_name: d.supporter_name,
      amount: d.amount,
      message: d.message,
      currency: d.currency,
      timestamp: d.timestamp,
    })),
    count: pending.length,
  });
};
