// Full original contents restored from commit d39503db39887fb223db492df9f00210da608655

// Existing helper functions
function blobToDataUrl(blob) {
    // implementation
}

// New helper function
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function handleCheckout() {
    try {
        // Replace sendInvoiceEmail/FormSubmit code
        const response = await fetch('/api/checkout', {
            method: 'POST',
            body: JSON.stringify({user, cart, orderReference, filename, pdfBase64, currency: ORDER_CURRENCY, totalAmount: invoice.total}),
            headers: {'Content-Type': 'application/json'},
        });
        if (!response.ok) {
            const result = await response.json();
            // If checkout fails, open result.waLink or handle fallback
            result.waLink ? window.open(result.waLink) : fallbackToWhatsApp();
        }
    } catch (error) {
        // Handle any other errors
        console.error(error);
    }
}