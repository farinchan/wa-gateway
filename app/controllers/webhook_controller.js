const whatsapp = require("wa-multi-session");
const ValidationError = require("../../utils/error");
const { responseSuccessWithData } = require("../../utils/response");
const fs = require('fs/promises');

exports.manageWebhook = async (req, res, next) => {
  try {
    const webhookData = await fs.readFile('./webhook.json', 'utf8');
    const WebhookJson = JSON.parse(webhookData);
    const sessionName = req.body.session || req.query.session || req.headers.session;
    const webhookUrl = req.body.webhookUrl || req.query.webhookUrl || req.headers.webhookUrl;

    if (!sessionName) {
      throw new ValidationError("Session name is required");
    }

    if (!webhookUrl) {
      throw new ValidationError("Webhook URL is required");
    }

    // Check if session exists
    const sessionExists = WebhookJson.some(item => item.session === sessionName);
    if (!sessionExists) {
      throw new ValidationError("Session not found");
    }
    // Update webhook URL for the session
    const sessionIndex = WebhookJson.findIndex(item => item.session === sessionName);
    WebhookJson[sessionIndex].webhookUrl = webhookUrl;
    await fs.writeFile('./webhook.json', JSON.stringify(WebhookJson, null, 2), 'utf8');
    

    res.status(200).json(responseSuccessWithData({ message: "Webhook updated successfully" }));
  } catch (error) {
    next(error);
  }
}


exports.webhooks = async (req, res, next) => {
  try {
    const webhookData = await fs.readFile('./webhook.json', 'utf8');
    const WebhookJson = JSON.parse(webhookData);
    res.status(200).json(responseSuccessWithData(WebhookJson));
  } catch (error) {
    next(error);
  }
}


