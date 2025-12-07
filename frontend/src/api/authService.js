import axios from "axios";
import { getDeviceFingerprint } from "../utils/fingerprint.js";


export async function login(email, password) {
  const fingerprint = await getDeviceFingerprint();

  return axios.post(
    "http://localhost:3000/auth/login",
    {
      email,
      password,
      fingerprintHash: fingerprint.hash
    },
    {
      withCredentials: true
    }
  );
}


export async function register(email, password, name) {
  const fingerprint = await getDeviceFingerprint();

  return axios.post(
    "http://localhost:3000/auth/register",
    {
      email,
      password,
      name,
      //deviceFingerprint: fingerprint.raw,
      fingerprintHash: fingerprint.hash
    },
    {
      withCredentials: true
    }
  );
}