async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}


export async function getDeviceFingerprint() {
  // qui metti la tua funzione già esistente
  const data = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    //platform: navigator.platform,
    cpuCores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    touch: "ontouchstart" in window,
    colorDepth: screen.colorDepth,
  };

  // canvas + webgl fingerprint come hai già fatto
  return {
    hash: await sha256(JSON.stringify(data)),
    raw: data
  };
}