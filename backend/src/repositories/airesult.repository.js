import { Airesult } from "../models/Airesult.js";

// Inserisce un record AIResult (append-only)
export const createAIResult = async (data) => {
  return Airesult.create(data);
};
