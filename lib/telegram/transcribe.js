import OpenAI, { toFile } from "openai";
import { getFile, downloadFile } from "./client";

export async function transcribeVoice(fileId) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tanımlı değil");
  }

  const fileInfo = await getFile(fileId);
  const buffer = await downloadFile(fileInfo.file_path);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = await toFile(buffer, "voice.ogg", { type: "audio/ogg" });

  const result = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "tr",
  });

  return result.text?.trim() || "";
}
