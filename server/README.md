# AI Resume Parser - Backend Flow

## Overview
This backend accepts a PDF resume, extracts its text, sends the text to Gemini AI, converts the AI response into structured JSON, caches the result, and returns it to the frontend.

---

# Request Flow

```text
Client
  ↓
POST /api/resume/parse
  ↓
Multer
  ↓
PDF Parse
  ↓
Cache Check
  ↓
Gemini AI
  ↓
JSON Parsing
  ↓
Cache Store
  ↓
Response
```

---

# Main Components

## 1. Multer

Purpose:

* Accept file uploads from frontend
* Store uploaded PDF in memory

Configuration:

```js
const upload = multer({
  storage: multer.memoryStorage(),
});
```

Available in:

```js
req.file.buffer
```

---

## 2. Resume Hash Generation

Purpose:
* Identify duplicate resumes
* Avoid repeated Gemini calls

Implementation:
```js
const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
```

Example:

```text
resume.pdf
↓
SHA256
↓
a4f6b9...
```

---

## 3. In-Memory Cache
Purpose:
* Return previously parsed results
* Reduce Gemini cost and latency

Implementation:
```js
const resumeCache = new Map();
```
Lookup:
```js
const cachedData =
  resumeCache.get(fileHash);
```

Store:
```js
resumeCache.set(fileHash,parsedData);
```

Flow:

```text
Hash
 ↓
Cache
 ↓
Hit?
 ↓
Return Data
```

---

## 4. PDF Parsing
Purpose:
* Extract text from uploaded PDF

Implementation:
```js
const parser = new PDFParse({
  data: req.file.buffer,
});

const pdfData =
  await parser.getText();
```

Output:

```text
Vikas Verma
Node.js
React
MongoDB
...
```

---

## 5. Gemini Integration

Purpose:
* Convert unstructured resume text into structured JSON

Model:
```js
gemini-2.5-flash
```

Prompt:

```text
Extract:

- fullName
- email
- phone
- skills
- experienceYears
- education

Return ONLY JSON.
```
Call:

```js
const result =
  await model.generateContent(
    prompt
  );
```

---

## 6. Response Cleanup

Gemini may return:
````text
```json
{
  "fullName":"Vikas"
}
````

````

Remove markdown:

```js
const cleanedResponse =
  response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
````

Result:

```json
{
  "fullName":"Vikas"
}
```

---

## 7. JSON Conversion
Convert string → object

```js
const parsedData =
  JSON.parse(cleanedResponse);
```

Output:

```js
{
  fullName: "Vikas",
  email: "abc@gmail.com"
}
```

---

## 8. API Response

Return parsed result:

```js
return res.status(200).json(
  parsedData
);
```

Example Response:

```json
{
  "fullName": "Vikas Verma",
  "email": "vikas@gmail.com",
  "phone": "9876543210",
  "skills": [
    "Node.js",
    "React",
    "MongoDB"
  ],
  "experienceYears": "2.6",
  "education": "B.Tech"
}
```

---

# Error Handling

## No File Uploaded

```json
{
  "message": "Please upload a resume"
}
```

Status:

```text
400 Bad Request
```

---

## Gemini Failure

```json
{
  "message": "Failed to parse resume"
}
```

Status:

```text
500 Internal Server Error
```

---

# Current Limitations

1. Cache is in-memory only.
2. Cache is cleared on server restart.
3. No Redis.
4. No database persistence.
5. No validation of Gemini response.
6. No async queue processing.

---

# Future Improvements

## Redis Cache

Replace:

```js
Map
```

with:

```text
Redis
```

Benefits:

* Shared across servers
* Survives application restarts

---

## Database Storage

Store:

```json
{
  "hash": "...",
  "parsedData": {...}
}
```

Benefits:

* Historical records
* Resume search

---

## Queue Processing

Current:

```text
Upload
 ↓
Gemini
 ↓
Response
```

Future:

```text
Upload
 ↓
Queue
 ↓
Worker
 ↓
Gemini
```

Tools:

* BullMQ
* RabbitMQ
* Kafka

---

# Technologies Used

* Node.js
* Express.js
* Multer
* pdf-parse
* Gemini API
* Crypto (SHA256)
* In-Memory Cache (Map)

---