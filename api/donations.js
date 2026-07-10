const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "";
const API_SECRET    = process.env.API_SECRET || "";
const REDIS_URL     = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN   = process.env.UPSTASH_REDIS_REST_TOKEN;
const QUEUE_KEY     = "donation_queue";

async function redisCall(command) {
  const res = await fetch(`${REDIS_URL}/${command}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await res.json();
  return json.result;
}

async function pushDonation(donation) {
  const val = JSON.stringify(donation);
  await redisCall(`rpush/${QUEUE_KEY}/${encodeURIComponent(val)}`);
}

async function popDonation() {
  const val = await redisCall(`lpop/${QUEUE_KEY}`);
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const body = req.body || {};
    console.log("[donations] Body:", JSON.stringify(body));
    const donation = {
      supporter_name: body.supporter_name || body.name || body.donator_name || body.username || body.from || "Anonymous",
      amount:         body.amount || body.donation_amount || body.nominal || 0,
      message:        body.message || body.support_message || body.pesan || "",
    };
    await pushDonation(donation);
    console.log(`[donations] Queued: ${donation.supporter_name} — Rp${donation.amount}`);
    return res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    const secret = req.query.secret || req.headers["x-api-secret"] || "";
    if (API_SECRET && secret !== API_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const donation = await popDonation();
    if (!donation) {
      return res.status(200).json({ hasNewDonation: false });
    }
    return res.status(200).json({
      hasNewDonation: true,
      donatorName:    donation.supporter_name || "Anonymous",
      amount:         donation.amount || 0,
      message:        donation.message || "",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
