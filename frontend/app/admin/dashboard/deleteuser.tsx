"use server"

import { connect } from 'quickpostgres'

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  host: process.env.DB_HOST || 'v2.aspekts.dev',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'musictracker'
}

export async function deleteUser(username: string) {
  const connection = await connect(dbConfig)
  
  try {
    const result = await connection.query(
      'DELETE FROM users WHERE username = $1',
      [username]
    )
    
    return { success: true, message: `User ${username} deleted successfully` }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, message: 'Failed to delete user' }
  } finally {
    await connection.end()
  }
}