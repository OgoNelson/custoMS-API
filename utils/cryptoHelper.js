const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.ENCRYPTION_KEY || "supersecretkey123";
console.log(SECRET_KEY);

// Encrypt text
function encrypt(text) {
  if (!text) {
    throw new Error("encrypt() called with empty text");
  }
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

// Decrypt text
function decrypt(ciphertext) {
  if (!ciphertext) {
    throw new Error("decrypt() called with empty ciphertext");
  }

  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new Error(
      "Failed to decrypt: invalid ciphertext or secret key mismatch"
    );
  }

  return decrypted;
}

module.exports = { encrypt, decrypt };
