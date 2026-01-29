import express from "express";

import AuthMiddleware from "#middlewares/AuthMiddleware.js";
import RequireAdminMiddleware from "#middlewares/RequireAdminMiddleware.js";

import MatchingController from "#controllers/MatchingController.js";

const routes = express.Router();

routes.use("/matching", AuthMiddleware);

routes.post("/matching/run", MatchingController.runMatching, RequireAdminMiddleware);

export default routes;
