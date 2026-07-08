export interface ReceiptTemplateData {
  productName: string;
  amountCents: number;
  currency: string;
  orderId: string;
  date: Date;
  libraryUrl: string;
  buyerName: string;
}

export const getReceiptTemplate = (data: ReceiptTemplateData): string => {
  const formattedAmount = (data.amountCents / 100).toFixed(2);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(data.date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Receipt</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 32px 40px;
      text-align: center;
    }
    .badge {
      width: 48px;
      height: 48px;
      background-color: #ff90e8;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      font-weight: bold;
      color: #000;
      font-size: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 16px;
      color: #3f3f46;
      margin-bottom: 24px;
    }
    .receipt-card {
      background-color: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .receipt-row:last-child {
      margin-bottom: 0;
    }
    .receipt-label {
      color: #71717a;
    }
    .receipt-value {
      font-weight: 500;
      color: #18181b;
      text-align: right;
    }
    .total-row {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #d4d4d8;
      font-size: 18px;
      font-weight: 600;
    }
    .cta-button {
      display: block;
      width: 100%;
      text-align: center;
      background-color: #ff90e8;
      color: #000000;
      text-decoration: none;
      padding: 16px 0;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 32px;
      border: 2px solid #000;
      box-shadow: 4px 4px 0 #000;
      transition: transform 0.1s;
    }
    .cta-button:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 #000;
    }
    .footer {
      text-align: center;
      padding: 24px 40px;
      background-color: #fafafa;
      color: #a1a1aa;
      font-size: 12px;
      border-top: 1px solid #f4f4f5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">G</div>
      <h1>Receipt of Purchase</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hi ${data.buyerName},<br><br>
        Thank you for your purchase! Your payment was successful and your product is now available in your library.
      </div>
      
      <div class="receipt-card">
        <div class="receipt-row">
          <span class="receipt-label">Product</span>
          <span class="receipt-value">${data.productName}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Order ID</span>
          <span class="receipt-value">${data.orderId}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Date</span>
          <span class="receipt-value">${formattedDate}</span>
        </div>
        <div class="receipt-row total-row">
          <span class="receipt-label" style="color: #18181b;">Total Paid</span>
          <span class="receipt-value">${data.currency} ${formattedAmount}</span>
        </div>
      </div>
      
      <a href="${data.libraryUrl}" class="cta-button">Access Product</a>
      
      <div style="font-size: 14px; color: #71717a; text-align: center;">
        Having trouble? Reply to this email and we'll help you out.
      </div>
    </div>
    
    <div class="footer">
      &copy; ${new Date().getFullYear()} Gumroad Clone. All rights reserved.<br>
      This is an automated receipt for order ${data.orderId}.
    </div>
  </div>
</body>
</html>
  `;
};
