import os
print("SUPABASE_URL:", os.environ.get("SUPABASE_URL"))
print("SUPABASE_SERVICE_ROLE_KEY:", "set" if os.environ.get("SUPABASE_SERVICE_ROLE_KEY") else "not set")
