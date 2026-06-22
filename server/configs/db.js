import { neon } from '@neondatabase/serverless'

let sql = null;
let initialized = false;

const initDb = async (connection) => {
  try {
    console.log("🔄 Initializing database tables...");
    
    // Create creations table
    await connection`
      CREATE TABLE IF NOT EXISTS creations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        prompt TEXT,
        content TEXT,
        type VARCHAR(100),
        publish BOOLEAN DEFAULT FALSE,
        likes TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create subscribers table
    await connection`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create brand_profiles table
    await connection`
      CREATE TABLE IF NOT EXISTS brand_profiles (
        user_id VARCHAR(255) PRIMARY KEY,
        brand_name VARCHAR(255) NOT NULL,
        brand_description TEXT,
        tone_of_voice VARCHAR(100),
        target_audience TEXT,
        primary_color VARCHAR(10),
        secondary_color VARCHAR(10),
        logo_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
};

// Lazy initialization of database connection
export const getSql = () => {
  if (!sql && process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
    if (!initialized) {
      initialized = true;
      initDb(sql); // run async without blocking
    }
  }
  return sql;
};

export default getSql;