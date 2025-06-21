const integrationModel = require('../models/integration.model');
const { get, getWithParams } = require('./helpers/axios.helper.service');

const FACEBOOK_APP_ID = process.env.FB_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FB_APP_SECRET;
const REDIRECT_URI = `${process.env.BASE_URL}/${process.env.FB_REDIRECT_URI}` || 'http://localhost:3000/api/integration/facebook/callback';
const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';
console.log('Chamara redirect url', REDIRECT_URI);

const getFacebookLoginURL = (userId) => {
    const scope = [
        "public_profile",
        "email",
        "pages_show_list",
        "pages_messaging",
        "pages_read_engagement",
        "whatsapp_business_messaging",
        "whatsapp_business_management",
        "business_management"
    ].join(',');

    return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}&response_type=code&state=${userId}`;
};

const exchangeCodeForToken = async (code) => {
    const response = await getWithParams(`${BASE_GRAPH_URI}/oauth/access_token`, {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
    });
    return response.data.access_token;
};

const getUserProfile = async (accessToken) => {
    const response = await get(`${BASE_GRAPH_URI}/me`, accessToken, {
        params: {
            fields: 'id,name,email'
        }
    });
    return response.data;
};

const getWhatsAppBusinessAccounts = async (userAccessToken) => {
    try {
        const businessRes = await get(`${BASE_GRAPH_URI}/me/businesses`, null, {
            params: { access_token: userAccessToken }
        });

        const businesses = businessRes.data.data;

        if (!businesses.length) {
            console.warn("No businesses found for the user.");
            return [];
        }

        const allWhatsAppAccounts = [];

        for (const business of businesses) {
            try {
                const wabaRes = await get(
                    `${BASE_GRAPH_URI}/${business.id}/owned_whatsapp_business_accounts`,
                    null,
                    { params: { access_token: userAccessToken } }
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
    const response = await get(`${BASE_GRAPH_URI}/${wabaId}/phone_numbers`, null, {
        params: { access_token: token }
    });
    return response.data.data;
};

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
    getWhatsAppAccountNumber
};