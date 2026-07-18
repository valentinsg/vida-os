import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/integrations/google-calendar";

// Visit this once, in a browser (not curl) — Google's consent screen needs
// an actual login. See ROADMAP.md for the one-time Google Cloud setup this
// depends on (client id/secret, redirect URI).
export async function GET() {
  return NextResponse.redirect(getAuthUrl());
}
