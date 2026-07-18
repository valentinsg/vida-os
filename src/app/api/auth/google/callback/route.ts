import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/integrations/google-calendar";

// One-time setup step, run by hand from a browser — not part of any
// ongoing flow. Shows the refresh_token exactly once (Google only issues
// it on first consent, or when prompt=consent forces reissue); copy it
// into .env as GOOGLE_REFRESH_TOKEN and it's done for good.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.refresh_token) {
    return NextResponse.json({
      error: "No refresh_token returned. Revoke this app's access at https://myaccount.google.com/permissions and try /api/auth/google again.",
    });
  }

  return NextResponse.json({
    message: "Copiá esto a tu .env como GOOGLE_REFRESH_TOKEN y no lo dejes en ningún lado más.",
    refresh_token: tokens.refresh_token,
  });
}
