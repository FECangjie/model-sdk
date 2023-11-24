import CryptoJS from 'crypto-js'

const key = '235325fdgerteGHdsfsdewred4345341'

// 加密
export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(key), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  }).toString()
}

// 解密
export function decrypt(text) {
  const decrypted = CryptoJS.AES.decrypt(text, CryptoJS.enc.Utf8.parse(key), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}