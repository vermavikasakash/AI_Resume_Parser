import { useEffect, useRef, useState } from "react";
import styles from "./App.module.css";

const emptyFormData = {
  fullName: "",
  email: "",
  phone: "",
  skills: [],
  experienceYears: "",
  education: "",
};

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const starterMessages = [
  {
    role: "assistant",
    content:
      "Upload and parse a resume, then I can answer questions using only that resume.",
  },
];

function App() {
  const [resume, setResume] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(starterMessages);
  const [formData, setFormData] = useState(emptyFormData);
  const chatTextareaRef = useRef(null);

  useEffect(() => {
    const textarea = chatTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [chatInput]);

  const handleUpload = async () => {
    if (!resume) {
      setError("Choose a PDF resume first.");
      return;
    }

    const data = new FormData();
    data.append("resume", resume);

    setIsParsing(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/resume-parse`, {
        method: "POST",
        body: data,
      });

      const parsed = await response.json();

      if (!response.ok) {
        throw new Error(parsed.message || "Unable to parse this resume.");
      }

      setFormData({
        fullName: parsed.fullName || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experienceYears: parsed.experienceYears || "",
        education: parsed.education || "",
      });
      setFileHash(parsed.fileHash || "");
      setMessages([
        {
          role: "assistant",
          content:
            "Resume parsed successfully. Ask me about skills, experience, education, projects, or contact details.",
        },
      ]);
    } catch (err) {
      setError(err.message);
      setFileHash("");
      setMessages(starterMessages);
    } finally {
      setIsParsing(false);
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();

    const question = chatInput.trim();

    if (!question || !fileHash || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: question }];

    setMessages(nextMessages);
    setChatInput("");
    setIsSending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileHash,
          message: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to answer this question.");
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: err.message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResumeChange = (event) => {
    const selectedFile = event.target.files[0] || null;

    setResume(selectedFile);
    setError("");
  };

  return (
    <main className={styles.appShell}>
      <section className={styles.parserPanel}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>AI resume parser</span>
          <h1 className={styles.title}>Extract resume details from a PDF</h1>
          <p className={styles.copy}>
            Upload a resume and review the structured profile returned by the
            backend.
          </p>
        </div>

        <div className={styles.uploadBox}>
          <label className={styles.fieldLabel} htmlFor="resume">
            Resume PDF
          </label>
          <input
            className={styles.input}
            id="resume"
            type="file"
            accept=".pdf"
            onChange={handleResumeChange}
          />
          <button
            className={styles.primaryButton}
            onClick={handleUpload}
            disabled={isParsing}
          >
            {isParsing ? "Parsing..." : "Parse Resume"}
          </button>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>

      <section className={styles.resultsPanel}>
        <h2 className={styles.sectionTitle}>Parsed Details</h2>

        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel}>
            Full name
            <input
              className={styles.input}
              value={formData.fullName}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>

          <label className={styles.fieldLabel}>
            Email
            <input
              className={styles.input}
              value={formData.email}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>

          <label className={styles.fieldLabel}>
            Phone
            <input
              className={styles.input}
              value={formData.phone}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>

          <label className={styles.fieldLabel}>
            Experience
            <input
              className={styles.input}
              value={formData.experienceYears}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>

          <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
            Skills
            <textarea
              className={styles.textarea}
              value={formData.skills.join(", ")}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>

          <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
            Education
            <input
              className={styles.input}
              value={formData.education}
              placeholder="Waiting for upload"
              readOnly
            />
          </label>
        </div>
      </section>

      <section className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <div>
            <span className={styles.eyebrow}>Resume chatbot</span>
            <h2 className={styles.sectionTitle}>Ask follow-up questions</h2>
          </div>
          <span
            className={`${styles.chatStatus} ${fileHash ? styles.active : ""}`}
          >
            {fileHash ? "Resume loaded" : "Waiting"}
          </span>
        </div>

        <div className={styles.chatWindow} aria-live="polite">
          {messages.map((message, index) => (
            <div
              className={`${styles.chatMessage} ${styles[message.role]}`}
              key={`${message.role}-${index}`}
            >
              {message.content}
            </div>
          ))}
          {isSending && (
            <div className={`${styles.chatMessage} ${styles.assistant}`}>
              Thinking...
            </div>
          )}
        </div>

        <form className={styles.chatForm} onSubmit={handleChatSubmit}>
          <textarea
            ref={chatTextareaRef}
            className={`${styles.input} ${styles.chatInput}`}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask about this resume..."
            disabled={!fileHash || isSending}
            rows={1}
          />
          <button
            className={styles.sendButton}
            type="submit"
            disabled={!fileHash || isSending || !chatInput.trim()}
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
