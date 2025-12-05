import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}