// CallMeBot is outbound-only (send-to-self, text-only) — no replies, no
// commands. That's the whole reason it's paired with a cron-triggered
// summary endpoint rather than anything conversational. See AGENTS.md.
export async function sendWhatsAppMessage(text: string): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    throw new Error("CALLMEBOT_PHONE and CALLMEBOT_APIKEY must be set");
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CallMeBot error: ${res.status} ${await res.text()}`);
  }
}
