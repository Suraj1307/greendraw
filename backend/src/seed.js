import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { supabase } from "./services/supabase.js";

dotenv.config();

const charities = [
  {
    slug: "first-tee-youth-golf",
    name: "First Tee Youth Golf",
    description: "Introduces young people to golf and life skills through inclusive coaching.",
    category: "youth",
    image_url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
    upcoming_event: "Junior Swing Day · April 18",
    featured: true
  },
  {
    slug: "clean-fairways-initiative",
    name: "Clean Fairways Initiative",
    description: "Supports sustainable golf course maintenance and water conservation projects.",
    category: "environment",
    image_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    upcoming_event: "Water Wise Golf Forum · May 02",
    featured: false
  },
  {
    slug: "birdies-for-education",
    name: "Birdies for Education",
    description: "Funds scholarships for students from underrepresented golfing communities.",
    category: "education",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    upcoming_event: "Scholarship Classic · June 12",
    featured: false
  },
  {
    slug: "caddies-to-careers",
    name: "Caddies to Careers",
    description: "Provides mentorship and career support for young caddies and course workers.",
    category: "careers",
    image_url: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    upcoming_event: "Mentor Match Evening · April 27",
    featured: false
  },
  {
    slug: "greens-for-good",
    name: "Greens for Good",
    description: "Channels community golf event revenue into local food and housing charities.",
    category: "community",
    image_url: "https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=1200&q=80",
    upcoming_event: "Community Open · May 20",
    featured: true
  }
];

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@greendraw.local").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: existingAdmin, error: existingAdminError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingAdminError) {
    throw existingAdminError;
  }

  if (existingAdmin) {
    return existingAdmin;
  }

  const { data: featuredCharity, error: charityError } = await supabase
    .from("charities")
    .select("id")
    .eq("featured", true)
    .limit(1)
    .maybeSingle();

  if (charityError) {
    throw charityError;
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("users")
    .insert({
      name: "GreenDraw Admin",
      email,
      password_hash: passwordHash,
      role: "admin",
      charity_id: featuredCharity?.id || null,
      charity_percentage: 10
    })
    .select("id, email")
    .single();

  if (adminError) {
    throw adminError;
  }

  return adminUser;
};

const runSeed = async () => {
  const { data, error } = await supabase
    .from("charities")
    .upsert(charities, { onConflict: "name" })
    .select("id, name");

  if (error) {
    throw error;
  }

  const admin = await seedAdmin();

  console.log("Seeded charities:", data);
  console.log("Admin credentials:", {
    email: process.env.ADMIN_EMAIL || "admin@greendraw.local",
    password: process.env.ADMIN_PASSWORD || "Admin@12345"
  });
  console.log("Admin row:", admin);
};

runSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
