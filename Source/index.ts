/* eslint @typescript-eslint/no-explicit-any: "off" */
import { Context } from "./Context";
import { config } from "dotenv";
import { SetupMongo } from "./SetupMongo";
import fs from "fs/promises";
import path from "path";
import { TextChannel } from "discord.js";
import { getLatestYoutubeVideo, getRandomYoutubeAPIKey, updateSubCountChannel } from "../Common/youtube";

config();

const ctx: Context = new Context();
ctx.env.validate();

// Application configuration
const CONFIG = {
  slowmode: {
    cooldown: ctx.env.get("slowmode_cooldown"),
    messageTimeWindow: ctx.env.get("slowmode_msg_time"),
    messageThreshold: ctx.env.get("slowmode_msg_threshold")
  },
  embedColor: 0x323338,
  paths: {
    latestVideo: path.join(process.cwd(), "latestvideo.json"),
    latestThread: path.join(process.cwd(), "latestthread.json")
  }
} as const;

global.slowmodeCooldown = CONFIG.slowmode.cooldown;
global.messageTimeWindow = CONFIG.slowmode.messageTimeWindow;
global.messageThreshold = CONFIG.slowmode.messageThreshold;
global.embedColor = CONFIG.embedColor;

async function postNewVideo(): Promise<void> {
  if (ctx.env.get("youtube_post_update") === "0") return;

  try {
    const latest = await getLatestYoutubeVideo(ctx.env.get("youtube_id"), getRandomYoutubeAPIKey(ctx));

    const channel = ctx.channels.resolve(ctx.env.get("youtube_post_channel")) as TextChannel;
    if (!channel) {
      console.error('YouTube post channel not found');
      return;
    }

    let currentVideoId: string | undefined;
    try {
      const data = await fs.readFile(CONFIG.paths.latestVideo, 'utf-8');
      currentVideoId = JSON.parse(data).video;
    } catch (err) {
      console.log(err);
    }

    if (currentVideoId === latest.id) {
      return;
    }

    const messages = await channel.messages.fetch({ limit: 100 });
    if (messages.some(message => message.content.includes(latest.id))) {
      console.log('Latest video already posted.');
      return;
    }

    const message = await channel.send({
      content: `<@&${ctx.env.get("youtube_video_discussions_role")}>\n# ${latest.title}\n${latest.description}\nhttps://www.youtube.com/watch?v=${latest.id}`,
      allowedMentions: { roles: [ctx.env.get("youtube_video_discussions_role")] }
    });

    const thread = await message.startThread({
      name: latest.title,
      autoArchiveDuration: 1440
    });

    await thread.send("# Reminder to follow the rules and to stay on topic!");

    try {
      const threadData = await fs.readFile(CONFIG.paths.latestThread, 'utf-8');
      const previousThreadId = JSON.parse(threadData).thread;
      if (previousThreadId) {
        const previousThread = channel.threads.resolve(previousThreadId);
        if (previousThread) {
          await previousThread.edit({
            locked: true,
            name: `[Closed] ${previousThread.name}`,
            archived: true
          });
        }
      }
    } catch (err) {
      console.log(err);
    }

    await Promise.all([
      fs.writeFile(CONFIG.paths.latestThread, JSON.stringify({ thread: thread.id })),
      fs.writeFile(CONFIG.paths.latestVideo, JSON.stringify({ video: latest.id }))
    ]);

  } catch (error) {
    console.error('Error in postNewVideo:', error);
  }
}

async function main() {
  try {
    await Promise.all(
      ["Command", "Event"].map(async (x) => {
        const handlerModule = await import(`../Handlers/${x}`);
        return handlerModule.default(ctx);
      })
    );

    await SetupMongo({ uri: ctx.env.get("db") });
    setInterval(postNewVideo, ctx.env.get("youtube_post_timer"));

    if (ctx.env.get("sub_update") === "1") {
      setInterval(updateSubCountChannel, ctx.env.get("sub_timer"));
    }

    await ctx.login(ctx.env.get("botToken"));
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

process
  .on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
  })
  .on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
  });

main().catch(console.error);
