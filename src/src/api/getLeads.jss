// src/api/getLeads.js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgeZteouyVWzrCvgHHQttx-5Bekgs_k-5EguO9Sn2p-XFrivFg9S7_gGKLdoDfCa08/exec";

export async function getLeads() {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL);
    if (!res.ok) throw new Error("Erro ao buscar leads");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Erro ao buscar leads:", err);
    return [];
  }
}
