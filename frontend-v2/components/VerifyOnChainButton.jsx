"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract"

const cardStyle = {
  border: "1px solid #4f46e5",
  borderRadius: "6px",
  padding: "16px",
  background: "rgba(79, 70, 229, 0.08)",
}

export function VerifyOnChainButton({ fileHash }) {
  const [status, setStatus] = useState("idle")
  const [record, setRecord] = useState(null)
  const [error, setError] = useState("")

  async function verifyOnChain() {
    setStatus("loading")
    setError("")
    setRecord(null)

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
      if (!rpcUrl) {
        throw new Error("NEXT_PUBLIC_SEPOLIA_RPC_URL is not configured for this frontend.")
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const exists = await contract.verifyEvidence(fileHash)

      if (!exists) {
        setStatus("missing")
        return
      }

      const [firNumber, timestamp, uploadedBy] = await contract.getEvidence(fileHash)
      setRecord({
        firNumber,
        timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
        uploadedBy,
      })
      setStatus("verified")
    } catch (err) {
      setError(err?.reason || err?.message || "Unable to verify this hash on Sepolia.")
      setStatus("error")
    }
  }

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={verifyOnChain}
        disabled={status === "loading"}
        style={{
          border: "1px solid #4f46e5",
          borderRadius: "4px",
          padding: "9px 13px",
          color: "#c7d2fe",
          background: "transparent",
          cursor: status === "loading" ? "wait" : "pointer",
          fontWeight: 600,
        }}
      >
        {status === "loading" ? "Checking Sepolia..." : "Verify on Blockchain"}
      </button>

      {status === "missing" && (
        <p style={{ margin: "10px 0 0", fontSize: "14px", color: "#fcd34d" }}>
          This hash is not registered on Sepolia.
        </p>
      )}

      {status === "verified" && record && (
        <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.6, color: "#c7d2fe" }}>
          <div>Hash exists on Sepolia.</div>
          <div>FIR: {record.firNumber}</div>
          <div>Registered: {record.timestamp}</div>
          <div style={{ overflowWrap: "anywhere" }}>Uploaded by: {record.uploadedBy}</div>
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
