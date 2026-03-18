import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import { Resend } from 'resend';

const client = new MongoClient(process.env.MONGODB_URI);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const orderData = req.body;
    const pdfContent = orderData.pdf; // base64 PDF content from the order data

    // Save order to MongoDB
    await client.connect();
    const database = client.db('your-database-name');
    const orders = database.collection('orders');
    await orders.insertOne(orderData);

    // Sending email with attachment
    await resend.sendEmail({
      from: 'your-email@example.com',
      to: orderData.email,
      subject: 'Order Confirmation',
      html: `<p>Your order has been received.</p>`,
      attachments: [
        { content: pdfContent, filename: 'order.pdf', type: 'application/pdf' }
      ],
    });

    // Sending WhatsApp message
    await fetch(`https://graph.facebook.com/v13.0/YOUR_PHONE_NUMBER_ID/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: orderData.phone,
        text: { body: 'Your order has been placed successfully.' }
      }),
    });

    res.status(200).json({ message: 'Order processed successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}