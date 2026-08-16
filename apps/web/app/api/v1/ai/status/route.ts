export function GET() {
  return Response.json({
    data: {
      mode: process.env.OPENAI_API_KEY ? "live" : "demo",
      textModel: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.6-sol",
      imageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
    },
  });
}
