const { PDFParse } = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const resumeCache = new Map();

function buildResumeResponse(fileHash, cachedResume, fromCache = false) {
  return {
    ...cachedResume.parsedData,
    fileHash,
    fromCache,
  };
}

// gemini parseResume logic
async function parseResumeFn(req, res) {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a resume",
      });
    }
    // Caching logic
    const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

    const cachedData = resumeCache.get(fileHash);

    if (cachedData) {
      console.log("Cache Hit");
      return res
        .status(200)
        .json(buildResumeResponse(fileHash, cachedData, true));
    }
    // Caching logic ends

    parser = new PDFParse({
      data: req.file.buffer,
    });

    const pdfData = await parser.getText();
    const resumeText = pdfData.text;

    const prompt = `
Extract the following fields from the resume.

Return ONLY valid JSON.

{
  "fullName": "",
  "email": "",
  "phone": "",
  "skills": [],
  "experienceYears": "",
  "education": ""
}

Resume:
${resumeText}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    const cleanedResponse = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanedResponse);
    const cachedResume = { parsedData, resumeText };
    resumeCache.set(fileHash, cachedResume);

    return res.status(200).json(buildResumeResponse(fileHash, cachedResume));
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to parse resume",
    });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}

// ? CHAT FEATURE
async function chatFn(req, res) {
  try {
    const { fileHash, message } = req.body;

    if (!fileHash || !message?.trim()) {
      return res.status(400).json({
        message: "Please provide a resume and a question",
      });
    }

    const cachedResume = resumeCache.get(fileHash);

    if (!cachedResume) {
      return res.status(404).json({
        message: "Resume not found. Please upload the resume again.",
      });
    }

    const prompt = `
Resume:

${cachedResume.resumeText}

Question:
${message.trim()}

Answer only using the resume. If the resume does not contain the answer, say that the information is not available in the resume.
`;

    const result = await model.generateContent(prompt);

    return res.json({
      answer: result.response.text().trim(),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to answer the question",
    });
  }
}
module.exports = {
  parseResumeFn,
  chatFn,
};
