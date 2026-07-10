// ============================================================
// /api/check-donations — Roblox polling endpoint
// Return format sama persis dengan partydewa.vercel.app
// ============================================================

if (!global.donationQueue) {
  global.donationQueue = [];
}

const API_SECRET = process.env.API_SECRET || "";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const secret = req.query.secret || req.headers["x-api-secret"] || "";
  if (API_SECRET && secret !== API_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Ambil 1 donasi pertama dari queue (sama seperti partydewa — satu per poll)
  if (global.donationQueue.length === 0) {
    return res.status(200).json({ hasNewDonation: false });
  }

  const donation = global.donationQueue.shift();

  return res.status(200).json({
    hasNewDonation: true,
    donatorName: donation.supporter_name || "Anonymous",
    amount: donation.amount || 0,
    message: donation.message || ""
  });
};
