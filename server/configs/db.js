import { neon } from '@neondatabase/serverless'

let sql = null;

// Lazy initialization of database connection
export const getSql = () => {
  if (!sql && process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
};

export default getSql;