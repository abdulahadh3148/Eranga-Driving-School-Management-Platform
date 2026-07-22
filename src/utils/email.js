export const WEB3FORMS_ACCESS_KEY = "3833633e-93be-407e-8f3b-2b6a3c7a86b6";

/**
 * Sends an email notification to the admin using Web3Forms.
 * @param {string} subject - The subject line of the email
 * @param {string} message - The main body content of the email
 * @param {object} details - Additional key-value pairs to show in the email table
 */
export const sendAdminNotification = async (subject, message, details = {}) => {
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY_HERE") {
    console.warn("Web3Forms Access Key is missing. Email notification skipped.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", subject);
    formData.append("from_name", "Eranga Driving School System");
    
    // Construct the email body
    let bodyText = `${message}\n\n`;
    for (const [key, value] of Object.entries(details)) {
      bodyText += `${key}: ${value}\n`;
    }
    
    formData.append("message", bodyText);

    // We can also make it look nice if Web3forms sends it as HTML
    // (Web3forms natively formats fields nicely if we just send them as inputs, 
    // but building the message string is more reliable for dynamic details)

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      console.log("Admin email notification sent successfully:", subject);
    } else {
      console.error("Failed to send admin email notification:", data.message);
    }
  } catch (error) {
    console.error("Error sending admin email notification:", error);
  }
};
