import getSql from "../configs/db.js";

// Get user's brand profile
export const getBrandProfile = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthenticated" });
    }

    const sql = getSql();
    if (!sql) {
      return res.json({ success: false, message: "Database not available" });
    }

    const profile = await sql`
      SELECT * FROM brand_profiles 
      WHERE user_id = ${userId}
    `;

    if (profile.length === 0) {
      return res.json({ success: true, profile: null });
    }

    res.json({ success: true, profile: profile[0] });
  } catch (error) {
    console.error("Get brand profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save or update user's brand profile
export const saveBrandProfile = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthenticated" });
    }

    const {
      brand_name,
      brand_description = "",
      tone_of_voice = "Professional",
      target_audience = "",
      primary_color = "#3b82f6",
      secondary_color = "#1d4ed8",
      logo_url = ""
    } = req.body;

    if (!brand_name) {
      return res.status(400).json({ success: false, error: "Brand name required" });
    }

    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ success: false, error: "Database not available" });
    }

    const result = await sql`
      INSERT INTO brand_profiles (
        user_id, 
        brand_name, 
        brand_description, 
        tone_of_voice, 
        target_audience, 
        primary_color, 
        secondary_color, 
        logo_url, 
        updated_at
      ) 
      VALUES (
        ${userId}, 
        ${brand_name}, 
        ${brand_description}, 
        ${tone_of_voice}, 
        ${target_audience}, 
        ${primary_color}, 
        ${secondary_color}, 
        ${logo_url}, 
        NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        brand_name = EXCLUDED.brand_name,
        brand_description = EXCLUDED.brand_description,
        tone_of_voice = EXCLUDED.tone_of_voice,
        target_audience = EXCLUDED.target_audience,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        logo_url = EXCLUDED.logo_url,
        updated_at = NOW()
      RETURNING *
    `;

    res.json({ success: true, profile: result[0], message: "Brand profile saved successfully" });
  } catch (error) {
    console.error("Save brand profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
