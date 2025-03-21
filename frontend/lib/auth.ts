import { betterAuth } from "better-auth"; // Import the better-auth package
import pg from 'pg'; // Import the postgresnode package
const { Pool } = pg; // Destructure the Client object from the pg package
 
const pool = new Pool({
  user: 'postgres',
  password: process.env.PG_PASSWORD,
  host: 'api.aspekts.dev',
  port: 5334,
  database: 'musictracker',
});
export const auth = betterAuth({
    database: pool,
    emailandPassword:{
      enabled:true,
    },
  socialProviders: {
      google: {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },
  },
});