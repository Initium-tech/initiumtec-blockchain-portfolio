<img src="assets/concho.svg" alt="CONCHO — el gallo" width="130" align="right" />

# Initium Token (INIT) — Build a Real ERC-20 Token, Step by Step

A complete, working, beginner-friendly project: a **fixed-supply ERC-20 meme-style
token** built with Solidity + OpenZeppelin + Hardhat, a **browser wallet
interface**, and an honest guide to **launching it legitimately** — including how
value eventually moves through a DEX to ETH and on to an exchange like Coinbase.

Everything in this repo compiles and its 11 tests pass. Nothing here requires
real money until the very last (optional) mainnet section.

---

## 0. The mental model (read this first)

Three ideas unlock everything else:

1. **A token is not a coin in a wallet.** An ERC-20 token is just a smart
   contract on Ethereum holding a table: `address → balance`. "Sending tokens"
   means asking that contract to update two rows in its table. Your wallet
   never "contains" tokens; it contains the *key* that authorizes updates.

2. **A wallet is a keypair.** The private key signs transactions; the public
   address receives things. Whoever has the private key owns everything at
   that address, forever, no password reset. This is why every security rule
   below is ultimately about protecting that one string.

3. **Price only exists where there is a market.** A freshly deployed token is
   worth exactly nothing until someone creates a market for it (usually a
   Uniswap liquidity pool pairing it with ETH). Value flows:
   `your token ↔ ETH on a DEX → ETH sent to Coinbase → USD`.
   You can **not** deposit a custom token directly into Coinbase — Coinbase
   only credits assets it has listed. Sending INIT to a Coinbase address
   would destroy it. ETH is the bridge currency.

---

## 1. Project structure

```
cyptoproject/
├── contracts/InitiumToken.sol   # The token — 1 small, heavily commented file
├── test/InitiumToken.test.js    # 11 tests covering deploy/transfer/approve/burn
├── scripts/deploy.js            # Deploys + auto-verifies on Etherscan
├── wallet/index.html            # Browser wallet UI (MetaMask + ethers.js)
├── hardhat.config.js            # Networks: local, Sepolia testnet, mainnet
├── .env.example                 # Template for your secrets (copy to .env)
└── .gitignore                   # Keeps .env and build artifacts out of git
```

## 2. Prerequisites

- **Node.js 18+** (you have v26 — fine)
- **MetaMask** browser extension — [metamask.io](https://metamask.io)
- Free accounts (all have free tiers):
  - [Alchemy](https://www.alchemy.com) or [Infura](https://www.infura.io) — an RPC endpoint (your program's door into Ethereum)
  - [Etherscan API key](https://etherscan.io/myapikey) — to publish your verified source code

Dependencies are already installed (`npm install` was run). If you clone this
elsewhere, run `npm install` again.

## 3. The smart contract

Open [`contracts/InitiumToken.sol`](contracts/InitiumToken.sol). The entire
token is ~15 lines of actual code because it inherits audited OpenZeppelin
implementations:

```solidity
contract InitiumToken is ERC20, ERC20Burnable, ERC20Permit {
    constructor(uint256 initialSupply, address recipient)
        ERC20("Initium Token", "INIT")
        ERC20Permit("Initium Token")
    {
        require(recipient != address(0), "recipient is zero address");
        _mint(recipient, initialSupply * 10 ** decimals());
    }
}
```

**Why this design is the secure one** — every omission removes a rug-pull vector:

| Deliberately missing | Risk it eliminates |
|---|---|
| `mint()` | Deployer inflating supply and dumping on holders |
| `Ownable` / admin role | Any privileged switch that holders must trust |
| Pause / blacklist | Deployer freezing people's tokens |
| Transfer taxes / reflection | The #1 source of both bugs and hidden scams |
| Upgradeability proxy | Swapping honest code for malicious code later |

When a scanner like [honeypot.is](https://honeypot.is) or token-sniffer tools
analyze this contract, it comes up clean — because there is genuinely nothing
an insider can do to holders. That *is* the meme-coin trust signal.

**Renaming it:** change `"Initium Token"` / `"INIT"` in the constructor (both
the `ERC20` and `ERC20Permit` strings), adjust the test's expected names, done.

## 4. Compile and test

```bash
npx hardhat compile
npx hardhat test
```

You should see **11 passing**. Read the tests in
[`test/InitiumToken.test.js`](test/InitiumToken.test.js) — they double as
documentation: transfers, approvals (`approve` + `transferFrom`, the pattern
every DEX uses), burning, and a test asserting that **no mint function and no
owner exist**.

Try breaking things: add a `mint()` function to the contract and watch the
"supply can never grow" test fail. That's the feedback loop you learn from.

## 5. Run a local blockchain

```bash
npx hardhat node          # terminal 1 — a local Ethereum with 20 funded accounts
```

```bash
# terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

You'll get a contract address. You can even point MetaMask at
`http://127.0.0.1:8545` (chainId 31337) and import one of the printed test
keys to play with the wallet UI **against your local chain** — zero risk,
infinite retries. (Only ever import those well-known Hardhat test keys; they
are public and must never hold real funds.)

## 6. Deploy to Sepolia testnet (the real dry run)

Sepolia is a public Ethereum test network: real infrastructure, fake ETH.

1. **Create a dedicated deployer wallet.** In MetaMask: account menu → *Add
   account*. Never use your main account's key for development.
2. **Get free Sepolia ETH** from a faucet:
   [Google Cloud faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   or [Alchemy's faucet](https://www.alchemy.com/faucets/ethereum-sepolia).
3. **Configure secrets:**
   ```bash
   cp .env.example .env      # then edit .env with your RPC URL, key, Etherscan key
   ```
4. **Deploy + verify:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   The script prints the token address and automatically verifies the source
   on [sepolia.etherscan.io](https://sepolia.etherscan.io) — so anyone can
   read the code behind your token. Transparency is a feature, not paperwork.
5. **See it in MetaMask:** switch to Sepolia → *Import tokens* → paste the
   contract address. Your 1,000,000,000 INIT appear.

## 7. The wallet interface

[`wallet/index.html`](wallet/index.html) is a single-file web wallet: connect
MetaMask, view your INIT + ETH balance (live-updating via `Transfer` events),
and send tokens.

```bash
# 1. paste your deployed token address into TOKEN_ADDRESS in wallet/index.html
# 2. serve it (MetaMask doesn't inject into file:// pages).
#    Port 4747 because 3000 is taken by another local app (Sara AI):
npx serve wallet -l 4747
```

**The security architecture is the lesson here:**

- The page **never sees a private key**. It builds an *unsigned* transaction
  and hands it to MetaMask; the human reviews and approves it inside the
  extension. Signing happens in MetaMask's sandbox.
- Inputs are validated client-side (`ethers.isAddress`, amount parsing,
  balance check) *before* anything is proposed — but the real safety boundary
  is always MetaMask's confirmation screen.
- Only a 6-function ABI is included — the UI physically can't call anything else.
- Rule of thumb forever: **any website that asks you to type a private key or
  seed phrase is stealing from you.** No exceptions.

## 8. Ethical launch playbook (test → transparent mainnet → DEX → ETH → Coinbase)

This is the legitimate version of "token → money," in order, with no step skipped.

### Phase A — Prove it on testnet (weeks, not hours)
- Full cycle on Sepolia: deploy, verify, distribute to friends/community
  testers, run the wallet UI against it.
- On Sepolia you can even create a Uniswap test pool to rehearse Phase C.

### Phase B — Launch transparently on mainnet
- Deploy with the same script (`--network mainnet`). Cost: one deployment
  transaction (typically on the order of tens of dollars depending on gas).
- **Verify the source on Etherscan** (the script does it).
- Publish, before anyone buys anything: total supply, exactly what the team
  wallet holds, the contract address from your official channel only (fake
  copies of new tokens appear fast), and a plain-English statement that this
  is an experimental community token with **no promise of profit**. That
  sentence matters legally: promising profits from your efforts is what pulls
  a token toward being an unregistered security (see Phase E).

### Phase C — Create a real market (Uniswap liquidity pool)
This is where "DEX" happens, and it's simpler than it sounds:

1. Go to [app.uniswap.org](https://app.uniswap.org) → *Pool* → *Create position*.
2. Pair **INIT + ETH** and deposit both (e.g. 50% of supply + some ETH).
   The ratio you deposit *sets the initial price*: if you deposit 500M INIT
   against 1 ETH, the opening price is 1 ETH per 500M INIT.
3. You receive an **LP (liquidity provider) position**. Anyone in the world
   can now swap ETH↔INIT against your pool; you earn a small fee on each swap.
4. **The single biggest trust signal for a meme token:** lock the LP position
   (e.g. via UNCX or Team Finance) or burn it. "Rug pull" literally means the
   deployer withdrawing the pool's ETH; provably giving up that ability is
   what separates community projects from scams. Announce the lock tx.

### Phase D — Converting value to ETH → Coinbase, honestly
- If the community grows and the token has real trading volume, value reaches
  you two legitimate ways: **LP fees** and **pre-disclosed team-wallet sales**.
- Disclose the team allocation up front (e.g. "team holds 5%, vested, any
  sale announced in advance") and stick to it. Selling into your own community
  without disclosure is the exact behavior you promised not to do.
- Mechanics: Uniswap swap INIT → ETH → send ETH to your Coinbase deposit
  address (Coinbase → Receive → Ethereum network) → sell for USD. Do a small
  test send first; ETH transfers to Coinbase are routine.
- **Timescale honesty:** fees and legitimate sales produce meaningful funding
  only if the token genuinely earns a community over months. There is no
  ethical 48-hour version — a token designed to be exited in 48 hours *is*
  the scam pattern, just with extra steps. If Initiumtec needs near-term
  funding, that path is clients, grants, or investors, with this project as
  a portfolio piece demonstrating your blockchain capability.

### Phase E — Legal & tax reality (not optional)
- **Securities law:** marketing a token as an investment ("get in early,
  we'll pump it") can make it an unregistered security (in the US, the Howey
  test; SEC enforcement against meme-token promoters is real). Marketing it
  as a fun, no-promises community experiment keeps you on the safe side of
  that line — which is also just the truthful description.
- **Taxes:** swapping INIT→ETH and ETH→USD are each taxable events in most
  jurisdictions. Keep a spreadsheet of every transaction from day one.
- Given Puerto Rico/US context, 30 minutes with a crypto-familiar accountant
  before mainnet is the cheapest insurance you'll ever buy.

## 9. Security checklist (the compressed version)

**Key hygiene**
- [ ] `.env` never committed (already git-ignored); no key ever pasted into chat/screenshots
- [ ] Dedicated deployer wallet, funded only with what deployment needs
- [ ] Hardware wallet (Ledger/Trezor) before any account holds real value
- [ ] Seed phrases on paper/steel, never in a file, photo, or password manager note

**Contract**
- [ ] Only audited libraries (OpenZeppelin), pinned versions — never copy random contract code
- [ ] No admin powers unless truly needed (this token: none)
- [ ] Tests pass; source verified on Etherscan on every network you deploy to

**Operations**
- [ ] Everything rehearsed on Sepolia before mainnet
- [ ] Small test transaction before any large transfer (including the first Coinbase send)
- [ ] Official contract address published in exactly one canonical place
- [ ] LP locked/burned and the lock transaction announced

## 10. Token utility: the Concho Club gate

`gate/server.js` is a working example of the most common real token utility —
**token-gated access** (the pattern behind gated Discords, beta programs, and
members content). Run `node gate/server.js` → http://localhost:4748.

How it works (Sign-In with Ethereum):
1. The browser requests a one-time nonce for its address.
2. The user signs a message containing it in MetaMask — free, no gas, no tx.
3. The server recovers the signer from the signature (proof of ownership),
   checks `balanceOf(address)` on-chain, and only grants a session if the
   wallet holds ≥ 1,000,000 CONCHO.
4. Gated content is only served behind that session — it cannot be bypassed
   client-side, and the server holds no keys and can move no funds.

Why this matters economically: gating something people want behind a token
holding creates a *non-speculative reason to acquire and hold* the token —
which is what "utility" actually means.

## 11. Where to go next

- Read the OpenZeppelin `ERC20.sol` you're inheriting — it's short and clear.
- Add a feature on a branch (e.g. `ERC20Votes` for governance) and write its tests first.
- [Ethereum.org ERC-20 docs](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/) ·
  [OpenZeppelin Contracts docs](https://docs.openzeppelin.com/contracts) ·
  [Uniswap docs](https://docs.uniswap.org)
