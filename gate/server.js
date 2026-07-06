// Concho Club — token-gated access server.
//
// The pattern (Sign-In with Ethereum + on-chain balance check):
//   1. Browser asks for a one-time nonce for its address.
//   2. User signs a human-readable message containing that nonce in MetaMask.
//      (Signing is free — no gas, no transaction, keys never leave MetaMask.)
//   3. Server recovers the signer address from the signature, so it KNOWS the
//      caller controls that address (not just claims to).
//   4. Server checks balanceOf(address) on-chain. >= 1,000,000 CONCHO => in.
//   5. Server issues a short-lived HMAC session token for /api/members.
//
// Security properties worth studying:
//   - The gate cannot be bypassed client-side: content only exists behind the API.
//   - Nonces are single-use and expire, so a captured signature can't be replayed.
//   - The signed message names this app + address + nonce, so a signature for
//     Concho Club can't be reused to log into some other service.
//   - The server holds NO private keys and can move NO funds. Read-only RPC.
//
// Run:  node gate/server.js     → http://localhost:4748
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { JsonRpcProvider, Contract, verifyMessage, formatUnits, isAddress } = require("ethers");

const PORT = 4748; // 3000 = Sara AI, 4747 = wallet UI
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const CONCHO = "0x01579f88f9D91bd4570aD56dA4D8b142A13C0DeC";
const THRESHOLD = 1_000_000n * 10n ** 18n; // hold >= 1M CONCHO to enter
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const SECRET = crypto.randomBytes(32); // sessions die on restart — fine for a demo

const provider = new JsonRpcProvider(RPC_URL);
const token = new Contract(CONCHO, ["function balanceOf(address) view returns (uint256)"], provider);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- nonce store (in-memory, single-use, 5 min expiry) ----------------------
const nonces = new Map();
const loginMessage = (address, nonce) =>
  `Concho Club login\n\nSign this message to prove you own this wallet.\nThis is free and sends no transaction.\n\nAddress: ${address}\nNonce: ${nonce}`;

app.post("/api/nonce", (req, res) => {
  const { address } = req.body ?? {};
  if (!isAddress(address)) return res.status(400).json({ error: "invalid address" });
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(address.toLowerCase(), { nonce, expires: Date.now() + 5 * 60 * 1000 });
  res.json({ message: loginMessage(address, nonce) });
});

// --- session tokens: HMAC(address|expiry) — stateless, unforgeable ----------
const sign = (payload) => crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
const makeSession = (address) => {
  const payload = `${address.toLowerCase()}|${Date.now() + SESSION_TTL_MS}`;
  return `${payload}|${sign(payload)}`;
};
const readSession = (tokenStr) => {
  const [address, expiry, mac] = (tokenStr ?? "").split("|");
  if (!address || !expiry || !mac) return null;
  const payload = `${address}|${expiry}`;
  const expected = sign(payload);
  if (mac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  if (Date.now() > Number(expiry)) return null;
  return address;
};

app.post("/api/verify", async (req, res) => {
  try {
    const { address, signature } = req.body ?? {};
    if (!isAddress(address)) return res.status(400).json({ error: "invalid address" });

    const entry = nonces.get(address.toLowerCase());
    nonces.delete(address.toLowerCase()); // single-use, success or fail
    if (!entry || Date.now() > entry.expires)
      return res.status(400).json({ error: "nonce missing or expired — request a new one" });

    // Cryptographic proof of ownership: recover the signer from the signature.
    let recovered;
    try {
      recovered = verifyMessage(loginMessage(address, entry.nonce), signature);
    } catch {
      return res.status(401).json({ error: "bad signature" });
    }
    if (recovered.toLowerCase() !== address.toLowerCase())
      return res.status(401).json({ error: "signature does not match address" });

    // On-chain membership check — the token IS the access key.
    const balance = await token.balanceOf(address);
    if (balance < THRESHOLD)
      return res.status(403).json({
        error: `not enough CONCHO: you hold ${formatUnits(balance, 18)}, need 1,000,000`,
      });

    res.json({ session: makeSession(address), balance: formatUnits(balance, 18) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// --- the gated resource ------------------------------------------------------
app.get("/api/members", (req, res) => {
  const address = readSession(req.headers.authorization?.replace("Bearer ", ""));
  if (!address) return res.status(401).json({ error: "not logged in" });
  res.json({
    welcome: `Bienvenido al Concho Club, ${address.slice(0, 8)}…`,
    perks: [
      "Early access to Initiumtec tools before public release",
      "Members-only build logs and tutorials",
      "Priority support channel",
    ],
    note: "This content only exists behind the server-side gate — holding 1M CONCHO is the key.",
  });
});

app.listen(PORT, () =>
  console.log(`Concho Club gate running at http://localhost:${PORT} (threshold: 1,000,000 CONCHO)`)
);
