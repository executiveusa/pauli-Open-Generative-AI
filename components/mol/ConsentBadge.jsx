'use client';

/**
 * ConsentBadge — visual consent status indicator.
 * Green ✅ = fully consented
 * Yellow ⚠️ = partially consented
 * Orange ⚠️ = political figure flag
 * Red 🚫 = blocked/revoked or minor
 *
 * @param {{
 *   isMinor?: boolean,
 *   isPolitical?: boolean,
 *   consentStatus?: {
 *     identityAllowed?: boolean,
 *     voiceCloningAllowed?: boolean,
 *     commercialAllowed?: boolean,
 *     trainingAllowed?: boolean,
 *     commercialUse?: boolean,
 *     likenessTrainingAllowed?: boolean,
 *     voiceCloningAllowed?: boolean,
 *   }
 * }} props
 */
export default function ConsentBadge({ isMinor = false, isPolitical = false, consentStatus = {} }) {
  // Check if blocked by minor status
  if (isMinor) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-medium"
        title="Minor — requires special handling"
      >
        <span>🚫</span>
        <span>Minor</span>
      </div>
    );
  }

  // Check if political figure
  if (isPolitical) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-950/40 border border-orange-900/60 text-orange-400 text-xs font-medium"
        title="Political figure — review compliance"
      >
        <span>⚠️</span>
        <span>Political</span>
      </div>
    );
  }

  // Count consents
  const consents = [
    consentStatus.identityAllowed ?? consentStatus.commercialUse,
    consentStatus.voiceCloningAllowed,
    consentStatus.commercialAllowed ?? consentStatus.commercialUse,
    consentStatus.trainingAllowed ?? consentStatus.likenessTrainingAllowed,
  ].filter(Boolean);

  // Fully consented
  if (consents.length === 4) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-xs font-medium"
        title="All consents granted"
      >
        <span>✅</span>
        <span>Consented</span>
      </div>
    );
  }

  // Partially consented
  if (consents.length > 0) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-950/40 border border-yellow-900/60 text-yellow-400 text-xs font-medium"
        title={`${consents.length} of 4 consents`}
      >
        <span>⚠️</span>
        <span>Partial</span>
      </div>
    );
  }

  // No consent
  return (
    <div
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-medium"
      title="No consents granted"
    >
      <span>🚫</span>
      <span>None</span>
    </div>
  );
}
