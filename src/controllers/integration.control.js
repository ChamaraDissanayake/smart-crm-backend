const integrationService = require('../services/integration.service');

exports.redirectToFacebookLogin = (req, res) => {
    try {
        const fbLoginUrl = integrationService.getFacebookLoginUrl();
        res.redirect(fbLoginUrl);
    } catch (error) {
        console.error('Error generating Facebook Login URL:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.handleFacebookCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) return res.status(400).send('Missing code in callback');

    try {
        // Exchange code and fetch WhatsApp business accounts
        const integrationData = await integrationService.processFacebookCallback(code);

        // TODO: Save integrationData to DB, associate with logged-in user

        // Respond or redirect as needed (e.g., dashboard or success page)
        res.json({
            message: 'WhatsApp integration successful',
            data: integrationData,
        });
    } catch (error) {
        console.error('Error processing Facebook callback:', error);
        res.status(500).send('Integration failed');
    }
};