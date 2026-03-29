require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl      = process.env.SUPABASE_URL;
const supabaseRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
}

const supabase = createClient(supabaseUrl, supabaseRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;