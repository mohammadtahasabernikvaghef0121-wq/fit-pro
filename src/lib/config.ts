export const siteConfig = {
  brand: "Fit Pro",
  coachName: "Mohammad Mahdi Saber Nik Vaghel",
  telegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME?.trim().replace(/^@/, "") || "TahaDeweloperr",
  telegramUrl: `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_USERNAME?.trim().replace(/^@/, "") || "TahaDeweloperr"}`,
  coachBio: process.env.COACH_BIO?.trim() || "",
  coachQualifications: process.env.COACH_QUALIFICATIONS?.trim() || "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://example.com",
};
