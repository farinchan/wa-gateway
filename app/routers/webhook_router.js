const { Router } = require("express");
const {
  webhooks,
  manageWebhook,
} = require("../controllers/webhook_controller");

const SessionRouter = Router();

SessionRouter.all("/webhooks", webhooks);
SessionRouter.all("/manage-webhook", manageWebhook);

module.exports = SessionRouter;
