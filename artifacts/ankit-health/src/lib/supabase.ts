import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://ukitmzngiiivzkgmnfip.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVraXRtem5naWlpdnprZ21uZmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDYyNjgsImV4cCI6MjA5ODQyMjI2OH0.2V76obz5FyBoPZhnYbVLvP1_6iAewoxPkt6TAcOkbC8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const edgeFn = async (name: string, body: object, accessToken: string) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify(body)
  });
  return res.json();
};
