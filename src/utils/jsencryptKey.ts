import JSEncrypt from "jsencrypt";

export const encryptKey = (data: string, publicKey: string): string => {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  const encrypted = encrypt.encrypt(data);
  return encrypted !== false ? encrypted : "";
}
