import { headers } from "next/headers";

export async function getBaseURL() {
  const headersList = headers();
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = headersList.get("host");

  return `${protocol}://${host}`;
}
