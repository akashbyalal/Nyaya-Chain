"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract"

const SEPOLIA_CHAIN_ID = 11155111n
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"

const buttonLabels = {
  idle: "Register Evidence on Blockchain",
  connecting: "Connecting wallet...",
  confirming: "Confirm in MetaMask...",
  mining: "Mining transaction...",
  done: "✅ Registered on-chain",
  error: "Try again",
}

const cardStyle = {
  border: "1px solid #4f46e5",
  borderRadius: "6px",
  padding: "16px",
  background: "rgba(79, 70, 229, 0.08)",
}

export function BlockchainDemoButton({ fileHash, firNumber }) {
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")
  const [transactionHash, setTransactionHash] = useState("")

  async function registerOnChain() {
    setStatus("connecting")
    setError("")
    setTransactionHash("")

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask was not found. Install or unlock MetaMask to run the live demo.")
      }

      let provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      let network = await provider.getNetwork()
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        await provider.send("wallet_switchEthereumChain", [{ chainId: SEPOLIA_CHAIN_ID_HEX }])
        provider = new ethers.BrowserProvider(window.ethereum)
        network = await provider.getNetwork()
      }

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        throw new Error("Please switch MetaMask to the Sepolia test network to continue.")
      }

      setStatus("confirming")
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const transaction = await contract.registerEvidence(fileHash, firNumber)

      setStatus("mining")
      const receipt = await transaction.wait()
      if (!receipt) {
        throw new Error("The transaction did not return a confirmation receipt.")
      }

      setTransactionHash(receipt.hash)
      setStatus("done")
    } catch (err) {
      setError(err?.reason || err?.message || "Unable to register evidence on-chain.")
      setStatus("error")
    }
  }

  const isWorking = ["connecting", "confirming", "mining"].includes(status)

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={registerOnChain}
        disabled={isWorking}
        style={{
          border: 0,
          borderRadius: "4px",
          padding: "9px 13px",
          color: "#ffffff",
          background: isWorking ? "#818cf8" : "#4f46e5",
          cursor: isWorking ? "wait" : "pointer",
          fontWeight: 600,
        }}
      >
        {buttonLabels[status]}
      </button>

      {status === "done" && (
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#c7d2fe" }}>
          <div>Transaction confirmed and permanently recorded.</div>
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#a5b4fc" }}
          >
            View transaction on Sepolia Etherscan
          </a>
        </div>
      )}

      {status === "error" && (
        <p role="alert" style={{ margin: "10px 0 0", fontSize: "14px", color: "#fca5a5" }}>
          {error}
        </p>
      )}
    </div>
  )
}
