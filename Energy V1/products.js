// Existing code...

// Convert a blob to Base64
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Function to send checkout data to the API
const sendCheckoutToApi = async (customerDetails, cartEntries, orderReference, invoice, ORDER_CURRENCY) => {
    const payload = {
        user: customerDetails,
        cart: cartEntries,
        orderReference,
        filename: invoice.filename,
        pdfBase64: await blobToBase64(invoice.pdfBlob), // assuming pdfBlob is available
        currency: ORDER_CURRENCY,
        totalAmount: invoice.total
    };

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            throw new Error('Checkout API call failed');
        }

        return await response.json();
    } catch (error) {
        open(result.waLink || fallbackToWhatsApp);
        throw error; // propagate error for further handling if needed
    }
};

// Update the handleCheckout function to call sendCheckoutToApi
const handleCheckout = async () => {
    // ... existing code to gather customerDetails, cartEntries, orderReference, invoice, ORDER_CURRENCY

    try {
        await sendCheckoutToApi(customerDetails, cartEntries, orderReference, invoice, ORDER_CURRENCY);
    } catch (error) {
        console.error("Checkout failed", error);
    }
};

// Existing code...