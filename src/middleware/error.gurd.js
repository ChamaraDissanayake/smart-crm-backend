const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
};

module.exports = errorHandler;