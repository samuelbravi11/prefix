import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  //bcrypt:
  // - legge il salt contenuto nell’hash
  // - rigenera hash della password inserita
  // - confronta i due valori
  //in questo caso non c'è bisogno di memorizzare il salt separatamente ma basta salvare l'hash completo ovvero hash(salt + password)
  return await bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}