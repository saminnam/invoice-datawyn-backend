export function amountInWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Zero Rupees Only'
  }
  
  const num = Math.round(amount)
  
  if (num === 0) {
    return 'Zero Rupees Only'
  }
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 
               'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
               'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertLessThanThousand(n) {
    if (n === 0) return ''
    
    if (n < 20) {
      return ones[n]
    } else if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    } else {
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
    }
  }
  
  function convert(n) {
    if (n === 0) return ''
    
    let result = ''
    
    // Lakhs
    if (Math.floor(n / 100000) > 0) {
      result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh '
      n %= 100000
    }
    
    // Thousands
    if (Math.floor(n / 1000) > 0) {
      result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand '
      n %= 1000
    }
    
    // Hundreds
    if (n > 0) {
      result += convertLessThanThousand(n)
    }
    
    return result.trim()
  }
  
  const words = convert(num)
  return words.charAt(0).toUpperCase() + words.slice(1) + ' Rupees Only'
}
