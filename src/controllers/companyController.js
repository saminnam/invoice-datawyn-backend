import CompanySettings from '../models/CompanySettings.js'
import { successResponse, errorResponse } from '../utils/response.js'

export const getPublicCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne()
    
    // If no settings exist, return default
    if (!settings) {
      return successResponse(res, {
        logo: null,
        companyName: 'Datawyn Technologies'
      })
    }
    
    // Return only public-safe information
    const publicSettings = {
      logo: settings.logo,
      companyName: settings.companyName
    }
    
    successResponse(res, publicSettings)
  } catch (error) {
    next(error)
  }
}

export const getCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne()
    
    // If no settings exist, create default
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'Datawyn Technologies',
        invoiceSettings: {
          prefix: 'PI',
          startingNumber: 1,
          defaultCurrency: 'INR',
          defaultGst: 18,
          defaultPaymentTerms: 'Due on Receipt',
          defaultNotes: 'Thank you for your business.',
          defaultTerms: [
            'This is a proforma invoice and not a tax invoice.',
            'Prices are valid for the specified validity period.',
            'Payment terms are as mentioned above.',
            'Additional requirements may be charged separately.',
            'Taxes are applicable as per government regulations.'
          ].join('\n')
        }
      })
    }
    
    successResponse(res, settings)
  } catch (error) {
    next(error)
  }
}

export const updateCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne()
    
    const updateData = { ...req.body }
    
    // Parse nested objects that were sent as JSON strings
    const nestedFields = ['address', 'bankDetails', 'authorizedSignatory', 'invoiceSettings']
    nestedFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field])
        } catch (e) {
          console.error(`Failed to parse ${field}:`, e)
        }
      }
    })
    
    // Handle logo file upload
    if (req.files && req.files.logo && req.files.logo[0]) {
      const logoFile = req.files.logo[0]
      if (logoFile.filename) {
        // Disk storage (local development)
        updateData.logo = `/uploads/${logoFile.filename}`
      } else if (logoFile.buffer) {
        // Memory storage (Vercel/serverless) - convert to base64 with size check
        const maxSize = 2 * 1024 * 1024 // 2MB limit
        if (logoFile.size > maxSize) {
          return errorResponse(res, 'Logo file too large. Maximum size is 2MB.', [], 400)
        }
        const base64Image = logoFile.buffer.toString('base64')
        updateData.logo = `data:${logoFile.mimetype};base64,${base64Image}`
      }
    }
    
    // Handle signature file upload
    if (req.files && req.files.signature && req.files.signature[0]) {
      const signatureFile = req.files.signature[0]
      if (signatureFile.filename) {
        // Disk storage (local development)
        updateData['authorizedSignatory.signatureImage'] = `/uploads/${signatureFile.filename}`
      } else if (signatureFile.buffer) {
        // Memory storage (Vercel/serverless) - convert to base64 with size check
        const maxSize = 1 * 1024 * 1024 // 1MB limit
        if (signatureFile.size > maxSize) {
          return errorResponse(res, 'Signature file too large. Maximum size is 1MB.', [], 400)
        }
        const base64Image = signatureFile.buffer.toString('base64')
        updateData['authorizedSignatory.signatureImage'] = `data:${signatureFile.mimetype};base64,${base64Image}`
      }
    }
    
    // Remove undefined values to avoid validation errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === 'undefined') {
        delete updateData[key]
      }
    })
    
    if (!settings) {
      settings = await CompanySettings.create(updateData)
    } else {
      settings = await CompanySettings.findByIdAndUpdate(
        settings._id,
        updateData,
        { new: true, runValidators: false }
      )
    }
    
    successResponse(res, settings, 'Company settings updated successfully')
  } catch (error) {
    console.error('Error updating company settings:', error)
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation error: ' + error.message, [], 400)
    }
    if (error.name === 'MongoError' && error.code === 134) {
      return errorResponse(res, 'Document too large. Try uploading a smaller image.', [], 400)
    }
    next(error)
  }
}

export const updateSignature = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne()
    
    if (!settings) {
      return errorResponse(res, 'Company settings not found', [], 404)
    }
    
    const updateData = {}
    
    // If a signature file was uploaded, handle it based on storage type
    if (req.file) {
      if (req.file.filename) {
        // Disk storage (local development)
        updateData['authorizedSignatory.signatureImage'] = `/uploads/${req.file.filename}`
      } else if (req.file.buffer) {
        // Memory storage (Vercel/serverless) - convert to base64
        const base64Image = req.file.buffer.toString('base64')
        updateData['authorizedSignatory.signatureImage'] = `data:${req.file.mimetype};base64,${base64Image}`
      }
    }
    
    // Also update name and designation if provided
    if (req.body.name) {
      updateData['authorizedSignatory.name'] = req.body.name
    }
    if (req.body.designation) {
      updateData['authorizedSignatory.designation'] = req.body.designation
    }
    
    settings = await CompanySettings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true, runValidators: true }
    )
    
    successResponse(res, settings, 'Signature updated successfully')
  } catch (error) {
    next(error)
  }
}
