import hashlib
import os

password = 'my_secret_password'  # The string to be hashed
salt = os.urandom(32)  # Generate a random 32-byte salt
hashed_password = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000) 