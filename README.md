# 🎰 Chainlink VRF Lottery DApp

A decentralized lottery application built with **React**, **Solidity**, and **Chainlink VRF**. Users can buy tickets with Sepolia ETH, and the admin can trigger a provably fair winner selection using Chainlink's Verifiable Random Function (VRF).

## 🚀 Features
* **Decentralized:** No central server controls the funds.
* **Provably Fair:** Uses Chainlink VRF (v2.5) to generate a random number on-chain.
* **Secure Payouts:** The winner automatically receives the entire prize pool.
* **Real-time UI:** Updates player count, balance, and status dynamically.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Ethers.js
* **Smart Contract:** Solidity (v0.8.19)
* **Oracle Network:** Chainlink VRF v2.5 (Sepolia Testnet)
* **Wallet Connection:** MetaMask

---

## 📦 Installation & Setup

### 1. Clone the Repository
Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username below:
```bash
git clone [https://github.com/atrijopal/chainlink-lottery-dapp.git](https://github.com/YOUR_GITHUB_USERNAME/chainlink-lottery-dapp.git)
cd chainlink-lottery-dapp
2. Install Dependencies
Bash

npm install
3. Configure the Contract
Open src/contractConfig.js and ensure the CONTRACT_ADDRESS and ABI match your deployed contract on the Sepolia testnet.

4. Run the Application
Bash

npm run dev
Open your browser and navigate to http://localhost:5173.

📜 Smart Contract Details
Network: Sepolia Testnet

Contract Address: 0x0D2433092776eCBC5BEeDDDbc83a83425a06d39c(pls change with yours)

Chainlink VRF Coordinator: 0x9Ddfa.... (VRF V2.5)(please change with your chanlink id)

Ticket Price: (you can update while you deploy the contract)

🎮 How to Play
Connect Wallet: Click the "Connect Wallet" button in the top right.

Get Funds: Ensure you have Sepolia ETH (for gas).

Buy Ticket: Enter the ticket price  and click "Buy Ticket".

Pick Winner (Admin Only):

The admin clicks "Start Winner Selection".

This sends a request to Chainlink.

Wait ~60 seconds for the callback.

Click "Refresh Info" to see the winner!

⚠️ Requirements
MetaMask Extension installed in your browser.

Sepolia Testnet ETH (for gas fees).

Chainlink Subscription: The contract must be added as a consumer to a funded Chainlink VRF Subscription.