import { headers } from "next/headers";

export async function getBaseURL() {
  const headersList = headers();
  // Hardcoded protocol to 'http' for local development to avoid SSL errors
  const protocol = "http";
  const host = headersList.get("host");

  return `${protocol}://${host}`;
}
