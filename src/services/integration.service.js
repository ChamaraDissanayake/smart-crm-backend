const axios = require('axios');

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const REDIRECT_URI = process.env.FB_REDIRECT_URI; // e.g. https://your-crm.com/api/integration/facebook/callback

// 1. Generate Facebook login URL for redirect
exports.getFacebookLoginUrl = () => {
    const scope = [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_messaging',
        'whatsapp_business_messaging',
        'whatsapp_business_management',
        'business_management',
    ].join(',');

    const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=${scope}`;

    return fbLoginUrl;
};

// 2. Handle OAuth callback: Exchange code for access token and fetch WhatsApp accounts
exports.processFacebookCallback = async (code) => {
    // Exchange code for access token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
            client_id: FB_APP_ID,
            client_secret: FB_APP_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
        },
    });

    const access_token = tokenRes.data.access_token;

    // Get user's WhatsApp Business Accounts
    const waRes = await axios.get('https://graph.facebook.com/v19.0/me/whatsapp_business_accounts', {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    // Fetch phone numbers for each WhatsApp Business Account
    const waAccounts = waRes.data.data || [];

    const phoneNumbers = [];

    for (const account of waAccounts) {
        const phoneRes = await axios.get(
            `https://graph.facebook.com/v19.0/${account.id}/phone_numbers`,
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        phoneNumbers.push({
            whatsappBusinessAccountId: account.id,
            phoneNumbers: phoneRes.data.data,
        });
    }

    return {
        access_token,
        whatsappBusinessAccounts: waAccounts,
        phoneNumbers,
    };
};
