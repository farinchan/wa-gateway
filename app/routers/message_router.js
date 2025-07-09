const { Router } = require("express");
const {
  sendMessage,
  sendBulkMessage,
  sendImageMessage,
  sendDocumentMessage,
  sendVoiceNoteMessage, 
} = require("../controllers/message_controller");
const MessageRouter = Router();

MessageRouter.all("/send-message", sendMessage);
MessageRouter.all("/send-bulk-message", sendBulkMessage);
MessageRouter.all("/send-image", sendImageMessage);
MessageRouter.all("/send-document", sendDocumentMessage);
MessageRouter.all("/send-voice-note", sendVoiceNoteMessage);


module.exports = MessageRouter;
