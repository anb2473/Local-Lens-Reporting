import hashlib
import os

password = input("Enter password to hash: ")
salt = os.urandom(32)
hashed_password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

# Convert to hex for .env storage
hashed_password_hex = hashed_password.hex()
salt_hex = salt.hex()

# Prepare lines to write
env_lines = [
    f"PASSW={hashed_password_hex}\n",
    f"SALT={salt_hex}\n"
    f"ALGORITHM=HS256\n",
    f"SECRET_KEY={os.urandom(32).hex()}\n"
]

# Write or update .env file
env_path = os.path.join(os.path.dirname(__file__), ".env")

with open(env_path, "w") as f:
    f.writelines(env_lines)

print("PASSW and SALT written to .env as hex strings, alongside SECRET_KEY and ALGORITHM.")