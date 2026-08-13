import mongoose from 'mongoose'
import { config } from './env.js'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri)
    
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
    })
    
    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected successfully')
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`)
  }
}
