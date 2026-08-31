import multer from 'multer'

// Configure multer for memory storage (for PDF uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

export default upload
