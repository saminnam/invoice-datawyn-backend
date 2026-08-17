import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { config } from '../config/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure storage based on environment
let storage

if (config.isVercel) {
  // Use memory storage for Vercel/serverless environment
  storage = multer.memoryStorage()
} else {
  // Use disk storage for local development
  const uploadsDir = path.join(__dirname, '../../uploads')
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
  } catch (error) {
    console.warn('Could not create uploads directory, falling back to memory storage:', error.message)
    storage = multer.memoryStorage()
  }

  if (!storage) {
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const fieldName = file.fieldname || 'file'
        cb(null, fieldName + '-' + uniqueSuffix + path.extname(file.originalname))
      }
    })
  }
}

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp, svg) are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Export configured upload instances for different fields
export const uploadLogo = upload.single('logo')
export const uploadSignature = upload.single('signature')

export default upload
