const { toDataURL } = require("qrcode");
const whatsapp = require("wa-multi-session");
const fs = require('fs/promises');
const ValidationError = require("../../utils/error");
const {
  responseSuccessWithMessage,
  responseSuccessWithData,
} = require("../../utils/response");

exports.createSession = async (req, res, next) => {
  try {
    const scan = req.query.scan;
    const sessionName =
      req.body.session || req.query.session || req.headers.session;
    if (!sessionName) {
      throw new Error("Bad Request");
    }

    const webhookData = await fs.readFile('./webhook.json', 'utf8');
    const WebhookJson = JSON.parse(webhookData);
    // Check if session already exists
    const sessionExists = WebhookJson.some(item => item.session === sessionName);
    if (!sessionExists) {
      // Add new session to the webhook JSON
      WebhookJson.push({ session: sessionName, webhookUrl: null });
      await fs.writeFile('./webhook.json', JSON.stringify(WebhookJson, null, 2), 'utf8');
    }
    
    whatsapp.onQRUpdated(async (data) => {
      if (res && !res.headersSent) {
        const qr = await toDataURL(data.qr);
        if (scan && data.sessionId == sessionName) {
          res.render("scan", { qr: qr });
        } else {
          res.status(200).json(
            responseSuccessWithData({
              qr: qr,
            })
          );
        }
      }
    });
    await whatsapp.startSession(sessionName, { printQR: true });
  } catch (error) {
    next(error);
  }
};
exports.deleteSession = async (req, res, next) => {
  try {
    const sessionName =
      req.body.session || req.query.session || req.headers.session;
    if (!sessionName) {
      throw new ValidationError("session Required");
    }
    whatsapp.deleteSession(sessionName);

    // Remove session from webhook.json
    const webhookData = await fs.readFile('./webhook.json', 'utf8');
    const WebhookJson = JSON.parse(webhookData);
    const sessionIndex = WebhookJson.findIndex(item => item.session === sessionName);
    if (sessionIndex !== -1) {
      WebhookJson.splice(sessionIndex, 1);
      await fs.writeFile('./webhook.json', JSON.stringify(WebhookJson, null, 2), 'utf8');
    }

    res
      .status(200)
      .json(responseSuccessWithMessage("Success Deleted " + sessionName));
  } catch (error) {
    next(error);
  }
};
exports.sessions = async (req, res, next) => {
  try {
    const key = req.body.key || req.query.key || req.headers.key;

    // is KEY provided and secured
    if (process.env.KEY && process.env.KEY != key) {
      throw new ValidationError("Invalid Key");
    }

    res.status(200).json(responseSuccessWithData(whatsapp.getAllSession()));
  } catch (error) {
    next(error);
  }
};
