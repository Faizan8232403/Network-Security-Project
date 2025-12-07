import secrets
from cryptography.fernet import Fernet
import qrcode

# Generate AES key (Fernet)
def generate_aes_key():
    return Fernet.generate_key()

# Encrypt file
def encrypt_file(file_path, key):
    from cryptography.fernet import Fernet
    fernet = Fernet(key)
    with open(file_path, 'rb') as f:
        data = f.read()
    encrypted = fernet.encrypt(data)
    with open(file_path, 'wb') as f:
        f.write(encrypted)

# Decrypt file
def decrypt_file(file_path, key):
    from cryptography.fernet import Fernet
    fernet = Fernet(key)
    with open(file_path, 'rb') as f:
        data = f.read()
    decrypted = fernet.decrypt(data)
    with open(file_path, 'wb') as f:
        f.write(decrypted)

# Generate 6-digit key
def generate_six_digit_key():
    return str(secrets.randbelow(1000000)).zfill(6)

# Generate QR code for a given string (URL)
def generate_qr_code(data, file_path):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")
    img.save(file_path)
