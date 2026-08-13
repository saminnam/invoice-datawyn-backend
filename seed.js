import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { config } from './src/config/env.js'
import User from './src/models/User.js'
import Customer from './src/models/Customer.js'
import Product from './src/models/Product.js'
import CompanySettings from './src/models/CompanySettings.js'

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Customer.deleteMany({})
    await Product.deleteMany({})
    await CompanySettings.deleteMany({})
    console.log('Cleared existing data')

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@datawyn.com',
      password: 'admin123',
      role: 'admin'
    })
    console.log('Created admin user')

    // Create staff user
    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@datawyn.com',
      password: 'staff123',
      role: 'staff'
    })
    console.log('Created staff user')

    // Create company settings
    const companySettings = await CompanySettings.create({
      companyName: 'Datawyn Technologies',
      email: 'info@datawyn.com',
      phone: '+91 98765 43210',
      website: 'https://datawyn.com',
      address: {
        street: '123 Tech Park',
        city: 'Chennai',
        state: 'Tamil Nadu',
        stateCode: 'TN',
        country: 'India',
        pincode: '600001'
      },
      gstin: '33AAAAA0000A1Z5',
      pan: 'ABCDE1234F',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolderName: 'Datawyn Technologies',
        accountNumber: '1234567890123456',
        ifsc: 'HDFC0001234',
        branch: 'Chennai Main Branch'
      },
      invoiceSettings: {
        prefix: 'PI',
        startingNumber: 1,
        defaultCurrency: 'INR',
        defaultGst: 18,
        defaultPaymentTerms: '50% Advance, 50% on Completion',
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
    console.log('Created company settings')

    // Create sample customers one by one to avoid duplicate customerId
    const customerData = [
      {
        companyName: 'Acme Corporation',
        contactPerson: 'John Doe',
        email: 'john@acme.com',
        phone: '+91 98765 43211',
        billingAddress: {
          street: '456 Business Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          stateCode: 'MH',
          country: 'India',
          pincode: '400001'
        },
        gstin: '27BBBBB0000B1Z5',
        pan: 'FGHIJ5678K',
        customerType: 'business',
        createdBy: admin._id
      },
      {
        companyName: 'Tech Solutions Ltd',
        contactPerson: 'Jane Smith',
        email: 'jane@techsolutions.com',
        phone: '+91 98765 43212',
        billingAddress: {
          street: '789 Innovation Street',
          city: 'Bangalore',
          state: 'Karnataka',
          stateCode: 'KA',
          country: 'India',
          pincode: '560001'
        },
        gstin: '29CCCCC0000C1Z5',
        pan: 'LMNOP9012Q',
        customerType: 'business',
        createdBy: admin._id
      },
      {
        companyName: 'Global Services',
        contactPerson: 'Mike Johnson',
        email: 'mike@globalservices.com',
        phone: '+91 98765 43213',
        billingAddress: {
          street: '321 Global Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          stateCode: 'TN',
          country: 'India',
          pincode: '600002'
        },
        gstin: '33DDDDD0000D1Z5',
        pan: 'RSTUV3456W',
        customerType: 'business',
        createdBy: admin._id
      }
    ]
    
    const customers = []
    for (const data of customerData) {
      const customer = await Customer.create(data)
      customers.push(customer)
    }
    console.log('Created sample customers')

    // Create sample products
    const products = await Product.create([
      {
        code: 'WEB-001',
        name: 'Website Development',
        type: 'service',
        description: 'Complete website development including design and development',
        unit: 'Project',
        price: 50000,
        gstRate: 18,
        hsnSacCode: '998311',
        status: 'active',
        createdBy: admin._id
      },
      {
        code: 'WEB-002',
        name: 'E-commerce Development',
        type: 'service',
        description: 'Full-featured e-commerce website with payment integration',
        unit: 'Project',
        price: 100000,
        gstRate: 18,
        hsnSacCode: '998311',
        status: 'active',
        createdBy: admin._id
      },
      {
        code: 'APP-001',
        name: 'Mobile App Development',
        type: 'service',
        description: 'Native mobile application for iOS and Android',
        unit: 'Project',
        price: 150000,
        gstRate: 18,
        hsnSacCode: '998313',
        status: 'active',
        createdBy: admin._id
      },
      {
        code: 'SUP-001',
        name: 'Server Setup',
        type: 'service',
        description: 'Server configuration and deployment',
        unit: 'Hour',
        price: 2000,
        gstRate: 18,
        hsnSacCode: '998313',
        status: 'active',
        createdBy: admin._id
      },
      {
        code: 'HOS-001',
        name: 'Web Hosting',
        type: 'service',
        description: 'Annual web hosting package',
        unit: 'Year',
        price: 10000,
        gstRate: 18,
        hsnSacCode: '998313',
        status: 'active',
        createdBy: admin._id
      }
    ])
    console.log('Created sample products')

    console.log('\n=== Seed Data Created Successfully ===')
    console.log('Admin Login:')
    console.log('  Email: admin@datawyn.com')
    console.log('  Password: admin123')
    console.log('\nStaff Login:')
    console.log('  Email: staff@datawyn.com')
    console.log('  Password: staff123')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
