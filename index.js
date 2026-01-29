// eslint-disable-next-line import/order
import dotenv from "dotenv";

// eslint-disable-next-line import/order
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import https from "node:https";

import oauthRoutes from "#routes/oauth.js";
import usersRoutes from "#routes/users.js";
import matchingRoutes from "#routes/matching.js";

import { formattedSendStatus } from "#utils/sendStatusJSONFormatter.js";

dotenv.config();

const server = express();
server.response.sendStatus = formattedSendStatus;

server.use(cors({ credentials: true, origin: process.env.WEBAPP_HOST }));
server.use(express.json({limit: 52428800}));
server.use(cookieParser());

server.use(oauthRoutes);
server.use(usersRoutes);
server.use(matchingRoutes);

if (process.env.SECURE == "true") {
    https.createServer({
        key: fs.readFileSync("./certs/privkey.pem"),
        cert: fs.readFileSync("./certs/fullchain.pem"),
    }, server).listen(process.env.API_PORT || 3000, () => {
        console.log("Server is running on port", process.env.API_PORT);
    });
} else {
    server.listen(process.env.API_PORT || 3000, () => {
        console.log("Server is running on port", process.env.API_PORT || 3000);
    });
}
