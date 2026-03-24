import { supabase } from "../services/supabase.js";

const buildSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const getCharities = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const featuredOnly = req.query.featured === "true";
    const category = req.query.category?.trim();

    let request = supabase
      .from("charities")
      .select("id, slug, name, description, category, image_url, upcoming_event, featured, created_at")
      .order("featured", { ascending: false })
      .order("name", { ascending: true });

    if (query) {
      request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (featuredOnly) {
      request = request.eq("featured", true);
    }

    if (category) {
      request = request.eq("category", category);
    }

    const { data: charities, error } = await request;

    if (error) {
      throw error;
    }

    return res.json({ charities });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch charities.",
      error: error.message
    });
  }
};

export const getCharityById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const { data: charity, error } = await supabase
      .from("charities")
      .select("id, slug, name, description, category, image_url, upcoming_event, featured, created_at")
      .or(`id.eq.${identifier},slug.eq.${identifier}`)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!charity) {
      return res.status(404).json({ message: "Charity not found." });
    }

    return res.json({ charity });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch charity.",
      error: error.message
    });
  }
};

export const selectCharity = async (req, res) => {
  try {
    const { charityId, percentage } = req.body;
    const contributionPercentage = Number(percentage);

    if (!charityId) {
      return res.status(400).json({ message: "charityId is required." });
    }

    if (!Number.isInteger(contributionPercentage) || contributionPercentage < 10 || contributionPercentage > 100) {
      return res.status(400).json({ message: "percentage must be an integer between 10 and 100." });
    }

    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charityId)
      .maybeSingle();

    if (charityError) {
      throw charityError;
    }

    if (!charity) {
      return res.status(404).json({ message: "Charity not found." });
    }

    const { data: updatedUser, error: userUpdateError } = await supabase
      .from("users")
      .update({
        charity_id: charityId,
        charity_percentage: contributionPercentage
      })
      .eq("id", req.user.id)
      .select("id, name, email, role, charity_id, charity_percentage")
      .single();

    if (userUpdateError) {
      throw userUpdateError;
    }

    return res.status(201).json({
      message: "Charity selection saved.",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save charity selection.",
      error: error.message
    });
  }
};

export const createCharity = async (req, res) => {
  try {
    const { name, description, category = "community", imageUrl = "", upcomingEvent = "", featured = false } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "name and description are required." });
    }

    const { data: charity, error } = await supabase
      .from("charities")
      .insert({
        slug: buildSlug(name),
        name,
        description,
        category,
        image_url: imageUrl,
        upcoming_event: upcomingEvent,
        featured: Boolean(featured)
      })
      .select("id, slug, name, description, category, image_url, upcoming_event, featured")
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ message: "Charity created.", charity });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create charity.",
      error: error.message
    });
  }
};

export const updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, imageUrl, upcomingEvent, featured } = req.body;

    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = buildSlug(name);
    }
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (upcomingEvent !== undefined) updates.upcoming_event = upcomingEvent;
    if (featured !== undefined) updates.featured = Boolean(featured);

    const { data: charity, error } = await supabase
      .from("charities")
      .update(updates)
      .eq("id", id)
      .select("id, slug, name, description, category, image_url, upcoming_event, featured")
      .single();

    if (error) {
      throw error;
    }

    return res.json({ message: "Charity updated.", charity });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update charity.",
      error: error.message
    });
  }
};

export const deleteCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("charities").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return res.json({ message: "Charity deleted." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete charity.",
      error: error.message
    });
  }
};
