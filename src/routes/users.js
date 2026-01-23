import express from "express";

import AuthMiddleware from "#middlewares/AuthMiddleware.js";
import RequireAdminMiddleware from "#middlewares/RequireAdminMiddleware.js";

import UserController from "#controllers/UserController.js";
import RequireSelfMiddleware from "#middlewares/RequireSelfMiddleware.js";

const routes = express.Router();

routes.post("/users/signup", UserController.add);

routes.use("/users", AuthMiddleware);

routes.post("/users", UserController.add, RequireAdminMiddleware);

routes.post("/users/addGodparentRelations", UserController.addGodparentRelations, RequireAdminMiddleware);

routes.get("/users/getToMatch", UserController.getToMatch, RequireAdminMiddleware);

routes.get("/users/getPendingApproval", UserController.getPendingApproval, RequireAdminMiddleware);

routes.get("/users/stats", UserController.getStats, RequireAdminMiddleware);

routes.put("/users/:id/approve", UserController.approve, RequireAdminMiddleware);

routes.get("/users/:id", UserController.read, RequireSelfMiddleware);

routes.put("/users/:id", UserController.update, RequireSelfMiddleware);

routes.delete("/users/:id", UserController.del, RequireAdminMiddleware);

export default routes;
