// funzione per verificare se bisogna chiamare l'AI regolistica
export const shouldRunRuleCheck = (asset, now, ruleThreshold) => {
  console.log(now - asset.lastRuleCheck, ruleThreshold, ((now - asset.lastRuleCheck) > ruleThreshold))
  return !asset.lastRuleCheck || ((now - asset.lastRuleCheck) > ruleThreshold);
};

export const shouldRunPredictiveCheck = (asset, now, aiThreshold) => {
  return !asset.lastAICheck || ((now - asset.lastAICheck) > aiThreshold);
};
