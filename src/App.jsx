import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "./contractConfig"; 


const styles = {
    container: {
        width: "90vw", 
        margin: "40px auto", 
        padding: "30px",
        fontFamily: "Roboto, sans-serif",
        backgroundColor: "#1e1e2f", 
        color: "#e0e0e0", 
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
    },
    header: { color: "#8aa1ff", textAlign: "center", marginBottom: "5px" },
    section: { borderTop: "1px solid #3c3c54", paddingTop: "20px", marginTop: "20px" },
    button: {
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        marginRight: "10px",
        transition: "background-color 0.2s, transform 0.1s",
        backgroundColor: "#7c93ff", 
        color: "#1e1e2f",
        fontWeight: "bold",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #3c3c54",
        backgroundColor: "#2a2a3e",
        color: "#e0e0e0",
        marginRight: "10px",
    },
    status: {
        backgroundColor: "#3c3c54",
        padding: "10px",
        borderRadius: "6px",
        marginTop: "15px",
    },
    list: {
        listStyleType: "none",
        padding: "0",
        maxHeight: "150px",
        overflowY: "auto",
        border: "1px solid #3c3c54",
        borderRadius: "6px",
        padding: "10px",
        backgroundColor: "#2a2a3e",
    },
    listItem: {
        backgroundColor: "#2a2a3e",
        padding: "5px 0",
        borderBottom: "1px dotted #3c3c54",
        fontSize: "14px",
        wordBreak: "break-all",
    }
};

function App() {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [ticketPrice, setTicketPrice] = useState(""); 
    const [inputAmount, setInputAmount] = useState(""); 
    const [status, setStatus] = useState("Awaiting wallet connection...");
    const [balance, setBalance] = useState("0");
    const [players, setPlayers] = useState([]);
    const [lastWinner, setLastWinner] = useState("None");
    const [owner, setOwner] = useState(null); 
    const [isLotteryOpen, setIsLotteryOpen] = useState(true); 

    // --- LOAD INFO FROM CONTRACT ---
    const loadInfo = useCallback(async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            // 1. FIX: Get Balance from the Provider (Network) instead of the Contract
            // The contract instance has a 'runner' (the signer), which has a 'provider'
            const balWei = await contractInstance.runner.provider.getBalance(CONTRACT_ADDRESS);
            setBalance(ethers.formatEther(balWei));

            // 2. Get Players
            const p = await contractInstance.getPlayers();
            setPlayers(p);

            // 3. Get Last Winner
            const w = await contractInstance.lastWinner();
            setLastWinner(w === "0x0000000000000000000000000000000000000000" ? "None" : w);
            
            // 4. Check Lottery State
            const lotteryState = await contractInstance.s_lotteryState();
            setIsLotteryOpen(lotteryState);

            // 5. Get Ticket Price
            const priceWei = await contractInstance.i_ticketPrice();
            const priceEth = ethers.formatEther(priceWei);
            setTicketPrice(priceEth); 
            setInputAmount(priceEth); 

        } catch (error) {
            console.error("Error loading info:", error);
            setStatus("Error loading info. Check console details.");
        }
    }, [contract]);

    // --- CONNECT WALLET ---
    const connectWallet = async () => {
        try {
            if (!window.ethereum) return alert("MetaMask not installed!");

            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setAccount(address);

            // Initialize Contract
            const lotteryContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            );

            setContract(lotteryContract);
            setStatus("Wallet connected successfully!");

            // Load Owner & Data
            const contractOwner = await lotteryContract.owner();
            setOwner(contractOwner);
            
            // Pass the new instance directly to loadInfo to avoid state delay
            loadInfo(lotteryContract);

        } catch (error) {
            console.error(error);
            setStatus("Error connecting wallet. Check console.");
        }
    };

    // --- BUY TICKET ---
    const buyTicket = async () => {
        if (!contract) return alert("Connect wallet first!");
        if (!isLotteryOpen) return alert("Lottery is currently picking a winner. Please wait.");

        try {
            setStatus("Confirming ticket purchase...");
            
            const tx = await contract.buyTicket({
                value: ethers.parseEther(inputAmount),
            });

            await tx.wait(); 
            setStatus("Ticket purchased successfully! Refreshing info...");
            loadInfo(); 

        } catch (error) {
            console.error(error);
            setStatus(`Error buying ticket. Ensure you have Sepolia ETH.`);
        }
    };

    // --- PICK WINNER ---
    const pickWinner = async () => {
        if (!contract) return alert("Connect wallet first!");
        if (account !== owner) return setStatus("Error: Only the contract owner can pick the winner.");

        try {
            setStatus("Requesting random winner from Chainlink... (This takes ~60 seconds)");
            
            const tx = await contract.pickWinner();
            await tx.wait();
            
            setStatus("Request Sent! Wait 1 minute for Chainlink, then click 'Refresh Info'.");
            loadInfo(); 

        } catch (error) {
            console.error(error);
            setStatus("Error picking winner. Check console.");
        }
    };

    // --- HOOK ---
    useEffect(() => {
        if (contract) loadInfo();
    }, [contract, loadInfo]);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>🎉  Lottery Dapp</h1>
            <p style={{ textAlign: 'center', color: '#a0a0c0' }}>
                Buy a ticket → Admin chooses winner randomly → Entire amount goes to winner 
            </p>

            {/* WALLET */}
            <div style={styles.section}>
                <h2>Wallet Connection</h2>
                <button style={styles.button} onClick={connectWallet}>
                    {account ? "Wallet Connected" : "Connect Wallet"}
                </button>
                <p><strong>Connected Account:</strong> {account || "Not connected"}</p>
                {account && (
                    <p style={{fontSize: '16px', fontWeight: 'bold', color: account === owner ? '#ff5c5c' : '#90ee90'}}>
                        Your Role: {account === owner ? 'ADMIN' : 'PLAYER'}
                    </p>
                )}
            </div>

            {/* PLAYER */}
            <div style={styles.section}>
                <h2>🎫 Player Actions</h2>
                <p style={{fontSize: '16px', fontWeight: 'bold', color: '#ffcc66'}}>
                    Price: {ticketPrice || '...'} ETH
                </p>
                
                <input
                    style={styles.input}
                    type="number"
                    step="any"
                    value={inputAmount} 
                    onChange={(e) => setInputAmount(e.target.value)} 
                    disabled={!contract || !account || !isLotteryOpen} 
                />
                <button
                    style={{
                        ...styles.button,
                        backgroundColor: isLotteryOpen ? "#7c93ff" : "#555",
                        cursor: isLotteryOpen ? "pointer" : "not-allowed"
                    }}
                    onClick={buyTicket}
                    disabled={!contract || !account || !isLotteryOpen}
                >
                    {isLotteryOpen ? "Buy Ticket" : "Calculated Winner..."}
                </button>
            </div>

            {/* ADMIN */}
            <div style={{...styles.section, backgroundColor: account === owner ? '#2a2a3e' : 'transparent', padding: '20px', borderRadius: '8px'}}>
                <h2>👑 Admin Actions</h2>
                <button
                    style={{
                        ...styles.button,
                        backgroundColor: account === owner ? '#ff5c5c' : '#7c93ff',
                        opacity: account === owner ? 1 : 0.5, 
                    }}
                    onClick={pickWinner}
                    disabled={!contract || account !== owner}
                >
                    Start Winner Selection (VRF)
                </button>
                {account !== owner && <p style={{color: '#ff5c5c', marginTop: '10px'}}>Owner only.</p>}
            </div>

            {/* INFO */}
            <div style={styles.section}>
                <h2>📊 Lottery Info</h2>
                <button style={styles.button} onClick={() => loadInfo()}>
                    Refresh Info
                </button>
                <p><strong>Contract Balance:</strong> <span style={{ color: '#90ee90' }}>{balance}</span> ETH</p>
                <p><strong>Last Winner:</strong> <span style={{ color: lastWinner !== 'None' ? '#ffd700' : '#a0a0c0' }}>{lastWinner}</span></p>
                
                <p><strong>Current Players ({players.length}):</strong></p>
                <ul style={styles.list}>
                    {players.length === 0 ? (
                        <li style={styles.listItem}>No players yet.</li>
                    ) : (
                        players.map((p, i) => <li key={i} style={styles.listItem}>{p}</li>)
                    )}
                </ul>
            </div>

            <div style={styles.status}><p><strong>Status:</strong> {status}</p></div>
        </div>
    );
}

export default App;