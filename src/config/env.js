import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173'],
  nodeEnv: process.env.NODE_ENV || 'development',
}

// Validate required environment variables
if (!config.mongoUri) {
  throw new Error('MONGO_URI is required in environment variables')
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required in environment variables')
}
