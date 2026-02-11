// src/repositories/airesult.repository.js

export const createAIResult = async (ctx, data) => {
  const { AIResult } = ctx.models;
  return AIResult.create(data);
};
