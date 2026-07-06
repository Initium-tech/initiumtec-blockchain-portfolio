# CONCHO mainnet launch checklist — budget, legal, listings

## Budget (decide chain first)

**Recommendation: launch on Base** (Coinbase's Ethereum L2) — same tooling,
same security model, ~100x cheaper, native Coinbase integration, and where
most 2024+ meme-coin communities actually live.

| Item | Ethereum mainnet | Base (recommended) |
|---|---|---|
| Deploy + verify | $80–200 | $1–5 |
| Create pool + add liquidity | $50–150 | $1–3 |
| LP lock (UNCX / Team Finance) | ~$100–300 fee | ~$50–150 |
| **LP seed capital (at risk)** | $1,000–2,000 typical micro-launch | $500–1,500 |
| Buffer / ops | $100 | $50 |
| **Total** | **~$1,400–2,750** | **~$600–1,700** |

LP seed is not a fee — it's capital that sits in the pool and can suffer
impermanent loss. Only fund it with money the business can lose.

## Legal / tax — questions for the accountant (bring this list)

1. Business structure: should token activity run through Initiumtec (LLC?) or
   separately? PR Act 60 implications, if any?
2. Tax character of: (a) LP fee income, (b) sales from team/ops allocations,
   (c) token-for-service payments. All are likely taxable events — how to log?
3. Donation handling: are donations to a US 501(c)(3) (the Conservancy)
   deductible against the token income? What records do they need?
4. Record-keeping: confirm a per-transaction log (date, tx hash, USD value at
   time) is sufficient. We can generate this automatically.
5. Any securities-law exposure given: fixed supply, no profit promises,
   published tokenomics, conservation pledge? (Bring the PLEDGE + TOKENOMICS
   docs to this meeting.)

## Listings (post-launch, in order)

- [ ] **Dexscreener / GeckoTerminal** — automatic once the pool exists; claim
      the token page and add logo + socials (~$300 one-time on Dexscreener,
      optional but worth it)
- [ ] **CoinGecko** application — free; needs: live pool with some volume,
      website, socials, logo
- [ ] **CoinMarketCap** application — free; same requirements, slower
- [ ] **Token lists for wallet icons** — submit logo PR to the appropriate
      token list repo for the chain (e.g. Base's token list / TrustWallet
      assets repo) so MetaMask/Coinbase Wallet show the toad
- [ ] **honeypot.is / TokenSniffer self-check** — run against the mainnet
      contract and link the clean result from the website

## Order of operations (nothing skips a step)

1. Conservancy partnership confirmed in writing
2. Community traction bar met (see community-plan.md)
3. Accountant meeting done, structure decided
4. Tokenomics finalized and published on the website
5. Deploy on Base + verify → create pool → **lock LP → publish lock tx**
6. Announce contract address from the official account (one canonical source)
7. Listings + first quarterly donation on schedule
