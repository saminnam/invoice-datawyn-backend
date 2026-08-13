import CompanySettings from '../models/CompanySettings.js'
import { successResponse, errorResponse } from '../utils/response.js'

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
    
    // If a logo file was uploaded, add its path to the update data
    if (req.file) {
      updateData.logo = `/uploads/${req.file.filename}`
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
