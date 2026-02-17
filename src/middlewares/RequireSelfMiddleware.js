function RequireSelfMiddleware(request, response, next) {
    if (request.userid !== request.params.id && request.role !== "ADMIN") {
        return response.sendStatus(403);
    }
    next();
}

export default RequireSelfMiddleware;
