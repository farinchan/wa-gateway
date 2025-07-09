const whatsapp = require("wa-multi-session");
const axios = require('axios');

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

  const webhookUrl = process.env.WEBHOOK_URL || null;
  if (webhookUrl) {
    console.log('Sending webhook to:', webhookUrl);
    // Send webhook in background, don't await
    axios.post(webhookUrl, messageResponse)
      .catch(err => {
        console.error('Failed to send webhook:', err.message);
      });
  }

});
