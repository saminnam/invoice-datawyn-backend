import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Routes
import authRoutes from './routes/authRoutes.js'
import customerRoutes from './routes/customerRoutes.js'
import productRoutes from './routes/productRoutes.js'
import proformaRoutes from './routes/proformaRoutes.js'
import invoiceRoutes from './routes/invoiceRoutes.js'
import companyRoutes from './routes/companyRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

const app = express()

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Use allowed origins from config or fallback to defaults
    const allowedOrigins = config.clientUrl.length > 0 ? config.clientUrl : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://invoice-datawyntechnologies.vercel.app'
    ]
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
})
app.use('/api/auth/', limiter)

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/proforma', proformaRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

// Error handling
app.use(notFound)
app.use(errorHandler)

export default app
