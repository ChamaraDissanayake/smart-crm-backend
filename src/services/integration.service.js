// src/services/integration.service.js
const axios = require('axios');
const integrationModel = require('../models/integration.model');

const FACEBOOK_APP_ID = process.env.FB_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FB_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/integration/facebook/callback';

const getFacebookLoginURL = (userId) => {
    const scope = [
        "public_profile",
        "email",
        "pages_show_list",
        "pages_messaging",
        "pages_read_engagement",
        'whatsapp_business_messaging',
        'whatsapp_business_management',
        "business_management"
    ].join(',');

    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}&response_type=code&state=${userId}`;
};

const exchangeCodeForToken = async (code) => {
    const response = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
        params: {
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            redirect_uri: REDIRECT_URI,
            code
        }
    });
    return response.data.access_token;
};

const getUserProfile = async (accessToken) => {
    const response = await axios.get('https://graph.facebook.com/me', {
        params: {
            fields: 'id,name,email'
        },
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return response.data;
};

const getWhatsAppBusinessAccounts = async (userAccessToken) => {
    try {
        // Step 1: Get the list of businesses the user manages
        const businessRes = await axios.get(
            `https://graph.facebook.com/v20.0/me/businesses?access_token=${userAccessToken}`
        );

        const businesses = businessRes.data.data;

        if (!businesses.length) {
            console.warn("No businesses found for the user.");
            return [];
        }

        const allWhatsAppAccounts = [];

        // Step 2: For each business, get the owned WhatsApp business accounts
        for (const business of businesses) {
            try {
                const wabaRes = await axios.get(
                    `https://graph.facebook.com/v20.0/${business.id}/owned_whatsapp_business_accounts?access_token=${userAccessToken}`
                );

                const whatsappAccounts = wabaRes.data.data;

                allWhatsAppAccounts.push(...whatsappAccounts);
            } catch (err) {
                console.error(`Error fetching WhatsApp accounts for business ID ${business.id}:`, err.response?.data || err);
            }
        }
        return allWhatsAppAccounts;
    } catch (error) {
        console.error("Error fetching businesses:", error.response?.data || error);
        return [];
    }
};

const getWhatsAppAccountNumber = async (wabaId, token) => {
    const response = await axios.get(`https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${token}`);
    return response.data.data; // Returns array of phone number objects with all their properties
}

const storeWhatsAppIntegration = async (userId, companyId, token, waba, phone) => {
    const { id: wabaId, name: businessName } = waba;
    const { id: phoneNumberId, display_phone_number: phoneNumber } = phone;

    return integrationModel.saveWhatsAppIntegration({
        userId,
        companyId,
        accessToken: token,
        whatsappBusinessAccountId: wabaId,
        phoneNumberId,
        phoneNumber,
        businessName
    });
};

const registerWhatsappNumber = async (phoneNumberId, accessToken) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/register`,
            {
                messaging_product: "whatsapp"
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Phone number ${phoneNumberId} registered successfully.`);
        return response.data;
    } catch (error) {
        console.error(`❌ Failed to register phone number ${phoneNumberId}:`, error.response?.data || error.message);
        throw error;
    }
};

const storeFacebookIntegration = async (userId, accessToken, userInfo) => {
    return integrationModel.saveIntegration(userId, accessToken, userInfo);
};

const checkIntegrationStatus = async (userId) => {
    return integrationModel.getIntegrationByUserId(userId);
};

const removeFacebookIntegration = async (userId) => {
    return integrationModel.deleteIntegration(userId);
};

module.exports = {
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
};