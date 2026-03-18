// Fetch the products
const products = [
  // Add product details here
];

// Convert blob to data URL
function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// New helper function to convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

// Handle the checkout process
async function handleCheckout() {
  const response = await fetch('/api/checkout', {  // Changed endpoint
    method: 'POST',
    body: JSON.stringify(products),
    headers: {'Content-Type': 'application/json'}
  });
  if (!response.ok) {
    // WhatsApp fallback behavior
    await sendInvoiceEmail(); // Fallback to existing behavior
  }
}