// Replacing the sendInvoiceEmail/FormSubmit flow with a new POST to /api/checkout

import { ORDER_INBOX_EMAIL, SALES_WHATSAPP_NUMBER } from "../constants";
import { showToast } from "../utils/toast";

async function sendInvoiceData({ user, cart, orderReference, filename, pdfBase64, currency, totalAmount }) {
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, cart, orderReference, filename, pdfBase64, currency, totalAmount })
    });

    const data = await response.json();
    if (data.success === false && data.fallback === true) {
        if (data.waLink) {
            window.open(data.waLink);
            showToast('Invoice sent, check WhatsApp for more info!');
        } else {
            fallbackToWhatsApp();
        }
    }
}

function fallbackToWhatsApp() {
    // Old fallback implementation if waLink is missing
}

function convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export { sendInvoiceData, convertBlobToBase64 };