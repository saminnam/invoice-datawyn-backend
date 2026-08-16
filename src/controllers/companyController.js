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
    const nestedFields = ['address', 'bankDetails', 'invoiceSettings']
    nestedFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field])
        } catch (e) {
          console.error(`Failed to parse ${field}:`, e)
        }
      }
    })
    
    // If a logo file was uploaded, handle it based on storage type
    if (req.file) {
      if (req.file.filename) {
        // Disk storage (local development)
        updateData.logo = `/uploads/${req.file.filename}`
      } else if (req.file.buffer) {
        // Memory storage (Vercel/serverless) - convert to base64
        const base64Image = req.file.buffer.toString('base64')
        updateData.logo = `data:${req.file.mimetype};base64,${base64Image}`
      }
    }
    
    if (!settings) {
      settings = await CompanySettings.create(updateData)
    } else {
      settings = await CompanySettings.findByIdAndUpdate(
        settings._id,
        updateData,
        { new: true, runValidators: true }
      )
    }
    
    successResponse(res, settings, 'Company settings updated successfully')
  } catch (error) {
    next(error)
  }
}
