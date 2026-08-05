export type LegalRecommendation = {
  law: string
  section: string
  title: string
  rationale: string
  confidence: number
}

export type LegalAnalysis = {
  summary: string
  recommendations: LegalRecommendation[]
  victimActions: string[]
  disclaimer: string
}

export type FirInput = {
  complainantName: string
  complainantEmail: string
  incidentDate: string
  location: string
  description: string
}

export type FirSummary = {
  id: string
  firNumber: string
  complainantName: string
  incidentDate: string
  status: string
  createdAt: string
}

export const FIR_STATUSES = [
  "Registered",
  "Under Review",
  "Investigation Open",
  "Evidence Pending",
  "Charge Sheet Filed",
  "Closed",
] as const

export type FirStatus = (typeof FIR_STATUSES)[number]

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? "Something went wrong. Please try again.")
  return body as T
}

export function analyzeFir(input: Pick<FirInput, "description" | "location" | "incidentDate">) {
  return request<LegalAnalysis>("/api/firs/analyze", { method: "POST", body: JSON.stringify(input) })
}

export function submitFir(input: FirInput) {
  return request<{ fir: { firNumber: string }; analysis: LegalAnalysis; emailSent: boolean }>("/api/firs", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function getRecentFirs() {
  return request<{ firs: FirSummary[] }>("/api/firs?limit=8", { method: "GET" })
}

export function updateFirStatus(id: string, status: FirStatus) {
  return request<{ fir: FirSummary }>(`/api/firs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}
