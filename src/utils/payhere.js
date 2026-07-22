/**
 * PayHere Sandbox Payment Gateway Utilities
 */

import md5 from 'md5';

const PAYHERE_CONFIG = {
  sandbox: true,
  merchantId: '1237014', 
  merchantSecret: 'MjIzNDQ2MTkzNzY5MTA2MjI5MDYzMDQzODY2MTE3MTE4Njk1MjI=',
  currency: 'LKR',
  country: 'Sri Lanka',
};

/**
 * Start a PayHere sandbox payment
 */
export async function startPayHerePayment({
  orderId,
  amount,
  studentName,
  email,
  phone,
  paymentFor,
  onCompleted,
  onDismissed,
  onError
}) {
  try {
    const amountFormatted = Number(amount).toFixed(2);
    
    // Hash generation (Local)
    const hashedSecret = md5(PAYHERE_CONFIG.merchantSecret).toUpperCase();
    const hashString = `${PAYHERE_CONFIG.merchantId}${orderId}${amountFormatted}${PAYHERE_CONFIG.currency}${hashedSecret}`;
    const hash = md5(hashString).toUpperCase();

    const nameParts = (studentName || 'Student').split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '-';

    // PayHere payment object
    const payment = {
      sandbox: PAYHERE_CONFIG.sandbox,
      merchant_id: PAYHERE_CONFIG.merchantId,
      return_url: window.location.origin + '/student',       
      cancel_url: window.location.origin + '/student',       
      notify_url: 'https://sandbox.payhere.lk/notify',              
      order_id: orderId,
      items: paymentFor || 'Driving School Payment',
      amount: amountFormatted,
      currency: PAYHERE_CONFIG.currency,
      hash: hash,
      first_name: firstName,
      last_name: lastName,
      email: email || 'student@eranga.lk',
      phone: phone || '0770000000',
      address: 'Eranga Driving School',
      city: 'Colombo',
      country: PAYHERE_CONFIG.country,
    };

    // Set up PayHere callbacks
    window.payhere.onCompleted = function onCompleted_(orderId) {
      console.log('PayHere Payment completed. OrderID:', orderId);
      if (onCompleted) onCompleted(orderId);
    };

    window.payhere.onDismissed = function onDismissed_() {
      console.log('PayHere Payment dismissed');
      if (onDismissed) onDismissed();
    };

    window.payhere.onError = function onError_(error) {
      console.log('PayHere Payment error:', error);
      if (onError) onError(error);
    };

    // Start the payment popup!
    window.payhere.startPayment(payment);
  } catch (error) {
    console.error("Failed to start payment:", error);
    if (onError) onError(error);
  }
}

export default PAYHERE_CONFIG;
