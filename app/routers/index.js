const { Router } = require("express");
const MessageRouter = require("./message_router");
const SessionRouter = require("./session_router");
const WebhookRouter = require("./webhook_router");

const MainRouter = Router();

MainRouter.use(SessionRouter);
MainRouter.use(MessageRouter);
MainRouter.use(WebhookRouter);

module.exports = MainRouter;
