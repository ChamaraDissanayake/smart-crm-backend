// src/controllers/integration.control.js

const {
  getFacebookLoginURL,
  exchangeCodeForToken,
  getUserProfile,
  storeFacebookIntegration,
  checkIntegrationStatus,
  removeFacebookIntegration,
  getWhatsAppBusinessAccounts,
  storeWhatsAppIntegration,
  getWhatsAppAccountNumber,
  registerWhatsappNumber
} = require('../services/integration.service');

const { getSelectedCompanyByUserId } = require('../services/company.service');

// Step 1: Redirect user to Facebook
const redirectToFacebookLogin = (req, res) => {
  const userId = req.query.userId;

  const loginURL = getFacebookLoginURL(userId);
  res.redirect(loginURL);
};

// Step 2: Facebook callback
const handleFacebookCallback = async (req, res) => {
  const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:4000';
  try {
    const code = req.query.code;
    const userId = req.query.state;

    if (!code || !userId) return res.status(400).send('Missing code or state');

    const token = await exchangeCodeForToken(code);
    const userInfo = await getUserProfile(token);

    await storeFacebookIntegration(userId, token, userInfo);

    const companyData = await getSelectedCompanyByUserId(userId);

    const wabas = await getWhatsAppBusinessAccounts(token);

    if (wabas.length) {
      for (const waba of wabas) {
        try {
          const phoneRes = await getWhatsAppAccountNumber(waba.id, token);
          const phones = phoneRes || [];

          if (phones.length > 0) {
            for (const phone of phones) {
              console.log('Chamara phone number going to register', phone);

              try {
                await registerWhatsappNumber(phone.id, token);
              } catch (err) {
                console.warn(`Skipping phone number ${phone.display_phone_number} - registration failed.`);
                continue; // Skip storing if registration fails
              }

              await storeWhatsAppIntegration(userId, companyData.id, token, waba, phone);
              console.log(`✅ Stored WhatsApp integration for WABA: ${waba.name}, Phone: ${phone.display_phone_number || phone.phone_number}`);
            }
          } else {
            console.warn(`⚠️ No phone numbers found for WABA: ${waba.name}`);
          }
        } catch (err) {
          console.error(`❌ Error fetching phone numbers for WABA ${waba.name || waba.id}:`, err.message);
        }
      }
    } else {
      console.warn("⚠️ No WhatsApp Business Accounts found.");
    }

    res.send(`
          <html>
            <body>
              <script>
                window.opener.postMessage({
                  type: "facebook-success",
                  payload: {
                    name: "${userInfo.name}",
                    email: "${userInfo.email}"
                  }
                }, "${FRONTEND_BASE_URL}");
                window.close();
              </script>
            </body>
          </html>
        `);
  } catch (error) {
    console.error('Facebook callback error:', error.message);
    res.send(`
          <html>
            <body>
              <script>
                window.opener.postMessage({
                  type: "facebook-failure",
                  error: "Facebook integration failed"
                }, "${FRONTEND_BASE_URL}");
                window.close();
              </script>
            </body>
          </html>
        `);
  }
};

// Status check (optional)
const getIntegrationStatus = async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const integration = await checkIntegrationStatus(userId);
  res.json({ connected: !!integration });
};

// Disconnect (optional)
const disconnectIntegration = async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await removeFacebookIntegration(userId);
  res.json({ message: 'Disconnected' });
};

module.exports = {
  redirectToFacebookLogin,
  handleFacebookCallback,
  getIntegrationStatus,
  disconnectIntegration
};