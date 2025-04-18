
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { paymentService } = require('../services/paymentService');

// Initialize express app
const app = express();

// Parse JSON requests
app.use(bodyParser.json());

/**
 * Verify Stripe webhook signature
 */
const verifyStripeSignature = (req) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) return false;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return false;
  }
};

/**
 * Stripe webhook endpoint
 */
app.post('/webhooks/stripe', async (req, res) => {
  let event;
  
  // Verify signature if in production
  if (process.env.NODE_ENV === 'production') {
    event = verifyStripeSignature(req);
    if (!event) {
      return res.status(400).send('Webhook signature verification failed');
    }
  } else {
    // In development, trust the event
    event = req.body;
  }
  
  try {
    // Process the payment event
    const result = await paymentService.processStripePayment(event);
    
    if (result.success) {
      return res.status(200).json({ received: true });
    } else {
      console.error('Error processing Stripe payment:', result.error);
      return res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PayPal webhook endpoint
 */
app.post('/webhooks/paypal', async (req, res) => {
  // Implement PayPal webhook handling
  res.status(200).json({ received: true });
});

/**
 * API endpoint for checking user status
 * Requires API key authentication
 */
app.get('/api/user/:userId', async (req, res) => {
  try {
    // Check API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.params.userId;
    
    // Get user details from database
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return sanitized user info
    const user = rows[0];
    const sanitizedUser = {
      id: user.telegram_id,
      username: user.username,
      isVerified: user.is_verified,
      isPremium: user.is_premium,
      credits: user.credits,
      projectCount: user.project_count,
      campaignCount: user.campaign_count,
      joinedAt: user.created_at
    };
    
    res.status(200).json(sanitizedUser);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Start webhook server
 */
function startWebhookServer() {
  const PORT = process.env.WEBHOOK_PORT || 3000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Webhook server running on port ${PORT}`);
  });
}

module.exports = {
  startWebhookServer
};
