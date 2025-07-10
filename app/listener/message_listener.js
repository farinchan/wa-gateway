const whatsapp = require("wa-multi-session");
const axios = require('axios');
const fs = require('fs/promises');


whatsapp.onMessageReceived(async (msg) => {
  if (msg.key.fromMe || msg.key.remoteJid.includes("status")) return;
  if (msg.message?.imageMessage) {
    // save image
    msg.saveImage("./public/storage/images/" + msg.key.id + ".jpg")

  }
  if (msg.message?.documentMessage) {
    // save document
    const fileName = msg.message.documentMessage.fileName || (msg.key.id + ".pdf");
    const ext = fileName.split('.').pop() || "pdf";
    const savePath = "./public/storage/documents/" + msg.key.id + "." + ext;
    msg.saveDocument(savePath)

  }

  if (msg.message?.audioMessage) {
    // save audio
    msg.saveAudio("./public/storage/audios/" + msg.key.id + ".mp3")
  }

  let messageResponse = {
    session: msg.sessionId,
    from: msg.key.remoteJid,
    name: msg.pushName,
    message: msg.message.conversation,
    media: {
      image: msg.message?.imageMessage ? '/p/storage/images/' + msg.key.id + '.jpg' : null,
      video: msg.message?.videoMessage ? 'video not supported' : null,
      document: msg.message?.documentMessage ? '/p/storage/documents/' + msg.key.id + '.' + (msg.message.documentMessage.fileName.split('.').pop() || 'pdf') : null,
      audio: msg.message?.audioMessage ? '/p/storage/audios/' + msg.key.id + '.mp3' : null,
    }
  }
  console.log("Message received:", messageResponse);

  await whatsapp.readMessage({
    sessionId: msg.sessionId,
    key: msg.key,
  });

  if (msg.message?.conversation && msg.message.conversation.toLowerCase() === 'ping') {
    await whatsapp.sendTyping({
      sessionId: msg.sessionId,
      to: msg.key.remoteJid,
      duration: 3000,
    });
    await whatsapp.sendTextMessage({
      sessionId: msg.sessionId,
      to: msg.key.remoteJid,
      text: "Pong!",
      answering: msg, // for quoting message
    });
  }

  const webhookData = await fs.readFile('./webhook.json', 'utf8');
  const WebhookJson = JSON.parse(webhookData);
  const sessionWebhook = WebhookJson.find(item => item.session === msg.sessionId);
  if (!sessionWebhook || !sessionWebhook.webhookUrl) {
    console.warn(`No webhook URL configured for session: ${msg.sessionId}`);
  } else {
    axios.post(sessionWebhook.webhookUrl, messageResponse)
      .then(response => {
        console.log('Webhook sent successfully:', response.data);
      })
      .catch(err => {
        console.error('Failed to send webhook:', err.message);
      });
  }



});
