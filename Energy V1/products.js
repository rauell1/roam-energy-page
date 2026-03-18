async function handleCheckout() {
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: customerDetails,
            cart: cartEntries,
            orderReference,
            filename: invoice.filename,
            pdfBase64: await blobToDataUrl(invoice.blob),
            currency: ORDER_CURRENCY,
            totalAmount: invoice.total
        })
    });

    if (!response.ok) {
        const result = await response.json();
        if (result.waLink) {
            window.open(result.waLink);
        } else {
            fallbackToWhatsApp(invoice.blob, invoice.filename, cartEntries, orderReference, invoice.total, customerDetails);
        }
    }
}