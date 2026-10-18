export interface PhonePrefix {
  code: string;  // e.g. "+48"
  label: string; // e.g. "🇵🇱 +48"
}

export const PHONE_PREFIXES: PhonePrefix[] = [
  { code: "+48", label: "🇵🇱 +48" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+43", label: "🇦🇹 +43" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+46", label: "🇸🇪 +46" },
  { code: "+47", label: "🇳🇴 +47" },
  { code: "+45", label: "🇩🇰 +45" },
  { code: "+358", label: "🇫🇮 +358" },
  { code: "+420", label: "🇨🇿 +420" },
  { code: "+421", label: "🇸🇰 +421" },
  { code: "+36", label: "🇭🇺 +36" },
  { code: "+40", label: "🇷🇴 +40" },
  { code: "+380", label: "🇺🇦 +380" },
  { code: "+7", label: "🇷🇺 +7" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+54", label: "🇦🇷 +54" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+30", label: "🇬🇷 +30" },
  { code: "+351", label: "🇵🇹 +351" },
  { code: "+353", label: "🇮🇪 +353" },
];

export interface PhoneValue {
  prefix: string;
  number: string;
}
