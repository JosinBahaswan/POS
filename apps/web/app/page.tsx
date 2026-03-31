import { redirect } from "next/navigation";

const DEFAULT_POS_APP_URL = "http://localhost:5173/#analytics";

function resolvePosAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_POS_APP_URL?.trim();
  if (!configuredUrl) {
    return DEFAULT_POS_APP_URL;
  }

  return configuredUrl;
}

export default function Home() {
  redirect(resolvePosAppUrl());
}
