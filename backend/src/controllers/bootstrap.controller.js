// controllers/bootstrap.controller.js
import bcrypt from "bcrypt";
import { sha256 } from "../services/crypto.service.js";
import { platformDb, tenantDb } from "../config/dbManager.js";
import { TenantSchema } from "../models/Tenant.js";
import { BootstrapTokenSchema } from "../models/BootstrapToken.js";
import { UserSchema, OnboardingStatus } from "../models/User.js";
import { generateEmailOtp, applyEmailOtpToUser } from "../services/emailOtp.service.js";
import { sendEmailOtp } from "../services/email.service.js";
import { signRegistrationToken } from "../services/registrationToken.service.js";

import { seedTenantMinimum } from "../seed/seedTenantMinimum.js";

export async function bootstrapStart(req, res) {
  try {
    console.log("[BOOTSTRAP] start", { body: req.body, tenant: req.tenant });
    const { token, name, surname, password, fingerprintHash } = req.body;
    if (!token || !name || !password || !fingerprintHash) {
      return res.status(400).json({
        message: "Missing fields",
        required: ["token", "name", "password", "fingerprintHash"],
      });
    }
    if (!process.env.BOOTSTRAP_TOKEN_PEPPER) throw new Error("Missing BOOTSTRAP_TOKEN_PEPPER");

    const pdb = platformDb();
    const Tenant = pdb.models.Tenant || pdb.model("Tenant", TenantSchema);
    const BootstrapToken = pdb.models.BootstrapToken || pdb.model("BootstrapToken", BootstrapTokenSchema);

    const tokenHash = sha256(token + process.env.BOOTSTRAP_TOKEN_PEPPER);

    const claimed = await BootstrapToken.findOneAndUpdate(
      { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true }
    ).lean();

    if (!claimed) return res.status(400).json({ message: "Invalid/expired/used token" });

    const tenant = await Tenant.findOne({ tenantId: claimed.tenantId }).lean();
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const tconn = tenantDb(tenant.dbName);

    // seed ruoli e permission
    const { adminRole } = await seedTenantMinimum(tconn);

    const User = tconn.models.User || tconn.model("User", UserSchema);

    const normalizedEmail = String(claimed.email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Bootstrap admin already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      tenantId: tenant.tenantId,
      isBootstrapAdmin: true,
      name,
      surname: surname || "",
      email: normalizedEmail,
      emailVerified: false,
      onboardingStatus: OnboardingStatus.EMAIL_VERIFICATION,
      status: "disabled",
      fingerprintHash,
      auth: { passwordHash, lastPasswordChangeAt: new Date(), refreshTokens: [] },

      // ruolo admin
      roles: [adminRole._id],
    });

    const otp = generateEmailOtp();
    const { expiresAt } = applyEmailOtpToUser(user, otp);
    await user.save();
    if (process.env.NODE_ENV !== "development") {
      console.log("[DEV OTP][BOOTSTRAP]", {
        email: user.email,
        otp,
        expiresAt: expiresAt.toISOString(),
      });
    }
    // console.log("[BOOTSTRAP] about to sendEmailOtp", { to: user.email });
    await sendEmailOtp({ to: user.email, otpCode: otp, expiresAt });
    console.log("[BOOTSTRAP] sendEmailOtp DONE");

    await Tenant.updateOne({ tenantId: tenant.tenantId }, { $set: { status: "active" } });

    const registrationToken = signRegistrationToken({ userId: user._id.toString() });

    return res.status(201).json({
      message: "Bootstrap started. Verify email OTP.",
      registrationToken,
      next: "POST /auth/verify-email",
    });
  } catch (err) {
    return res.status(500).json({ message: "Bootstrap error", error: err.message });
  }
}
