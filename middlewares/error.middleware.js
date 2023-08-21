const errorMiddleware = (error, req, res, next) => {

    req.statusCode = req.statusCode || 500;
    req.massgae = req.massgae || "Something went wrong";

    return res.status(req.statusCode).json({
        success: false,
        massgae: req.massgae,
        statck: error.statck
    });
}

export default errorMiddleware;