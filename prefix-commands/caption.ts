import { Message, AttachmentBuilder, User } from 'discord.js';
import Canvas from '@napi-rs/canvas';
import fetch from 'node-fetch';

export default {
  name: 'caption',
  category: 'IMAGE',
  description: 'Add Caption Text to an Image or Video',
  usage: 'caption <@user|image_url> <text> OR attach an image and provide <text>',
  examples: [
    'caption @User what an idiot',
    'caption https://example.com/image.png meme time',
    'caption meme time (with image attached)'
  ],
  async execute(message: Message, args: string[]) {
    let url: string | undefined;
    let text: string = '';

    // 1. Check for image attachment
    const attachment = message.attachments.find(att => att.contentType && att.contentType.startsWith('image/'));
    if (attachment) {
      url = attachment.url;
      text = args.join(' ');
    }

    // 2. If no attachment, check for user mention
    if (!url && message.mentions.users.size > 0) {
      const user: User = message.mentions.users.first()!;
      url = user.displayAvatarURL({ extension: 'png', size: 512 });
      text = args.filter(arg => !arg.includes('<@')).join(' ');
    }

    // 3. If no mention, check for URL in args
    if (!url) {
      url = args.find(arg => arg.startsWith('http'));
      text = args.filter(arg => arg !== url).join(' ');
    }

    if (!url || !text.trim()) {
      return message.reply('Usage: caption <@user|image_url> <text> OR attach an image and provide <text>');
    }

    try {
      // Download the image
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const buffer = Buffer.from(await response.arrayBuffer());
      const img = await Canvas.loadImage(buffer);

      // Prepare caption text (meme style)
      const caption = text;
      const fontSize = Math.floor(img.height / 10);
      const barHeight = Math.floor(fontSize * 1.5);

      // Create canvas with extra space for the white bar
      const canvas = Canvas.createCanvas(img.width, img.height + barHeight);
      const ctx = canvas.getContext('2d');

      // Draw white bar
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, barHeight);

      // Draw the image below the bar
      ctx.drawImage(img, 0, barHeight, img.width, img.height);

      // Draw caption text in black, bold, centered
      ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'black';
      const x = canvas.width / 2;
      const y = barHeight / 2;
      ctx.fillText(caption, x, y);

      // Send as attachment
      const outBuffer = await canvas.encode('png');
      const outAttachment = new AttachmentBuilder(outBuffer, { name: 'caption.png' });
      return message.reply({ files: [outAttachment] });
    } catch (err) {
      return message.reply('Failed to caption image: ' + err);
    }
  }
}; 