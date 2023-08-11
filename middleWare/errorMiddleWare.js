const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500
    res.status(statusCode)
    // connection string: mongodb+srv://ndzinfor:EtaBeaki1@cluster0.m6nrpwe.mongodb.net/Inventory_app?retryWrites=true&w=majority

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : null
    })
    
    (err.status)
};

module.exports = errorHandler;