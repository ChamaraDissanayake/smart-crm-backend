const axios = require('axios');

const defaultTimeout = 30000;

const axiosInstance = axios.create({
    timeout: defaultTimeout,
    maxBodyLength: Infinity
});

// Adds Bearer token if provided
const withAuthHeaders = (token, extraHeaders = {}) => {
    if (!token) return extraHeaders;
    return {
        Authorization: `Bearer ${token}`,
        ...extraHeaders
    };
};

const get = async (url, token = null, options = {}) => {
    return axiosInstance.get(url, {
        ...options,
        headers: withAuthHeaders(token, options.headers || {}),
    });
};

const post = async (url, data = {}, token = null, options = {}) => {
    return axiosInstance.post(url, data, {
        ...options,
        headers: withAuthHeaders(token, options.headers || {}),
    });
};

// Generic get with params (like for FB token exchange)
const getWithParams = async (url, params = {}, options = {}) => {
    return axiosInstance.get(url, {
        ...options,
        params,
    });
};

module.exports = {
    get,
    post,
    getWithParams,
};