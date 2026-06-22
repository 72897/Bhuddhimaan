import getSql from "../configs/db.js";



export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { page = 1, limit = 10 } = req.query;

    const sql = getSql();
    if (!sql) {
      return res.json({ success: false, message: "Database not available" });
    }

    const offset = (page - 1) * limit;

    const creations = await sql`
      SELECT 
        id,
        title,
        content,
        type,
        prompt,
        created_at,
        array_length(likes, 1) AS like_count
      FROM creations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ success: true, creations });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const getPublishedCreations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sql = getSql();
    if (!sql) {
      return res.json({ success: false, message: "Database not available" });
    }

    const offset = (page - 1) * limit;

    const creations = await sql`
      SELECT 
        id,
        title,
        content,
        type,
        prompt,
        created_at,
        array_length(likes, 1) AS like_count
      FROM creations
      WHERE publish = true
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ success: true, creations });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



export const toggleLikeCreations = async (req, res) => {
  try {
    const { userId } = req.auth || {};
    const { id } = req.body;

    const sql = getSql();
    if (!sql) {
      return res.json({ success: false, message: "Database not available" });
    }

    const userIdStr = userId.toString();

    // 🔥 Single query toggle (FAST)
    const result = await sql`
      UPDATE creations
      SET likes = 
        CASE 
          WHEN ${userIdStr} = ANY(likes)
            THEN array_remove(likes, ${userIdStr})
          ELSE array_append(likes, ${userIdStr})
        END
      WHERE id = ${id}
      RETURNING array_length(likes, 1) AS like_count,
        ${userIdStr} = ANY(likes) AS liked
    `;

    if (!result.length) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const { like_count, liked } = result[0];

    res.json({
      success: true,
      message: liked ? "Liked creation" : "Unliked creation",
      like_count,
      liked
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

