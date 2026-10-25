"use client";

import { useEffect, useRef, useState } from "react";

export function AudioDemoInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function readDuration(selected?: File) {
    setDuration(null);
    setFile(null);
    setError("");
    if (durationRef.current) durationRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (!selected) return;
    if (!["audio/mpeg", "audio/mp4", "audio/x-m4a"].includes(selected.type) || selected.size > 15 * 1024 * 1024) {
      setError("Choose an MP3 or M4A demo up to 15 MB.");
      if (inputRef.current) inputRef.current.value = "";
      if (durationRef.current) durationRef.current.value = "";
      return;
    }
    const objectUrl = URL.createObjectURL(selected);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const seconds = audio.duration;
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) {
        setError("Choose a demo that is one minute or shorter.");
        if (inputRef.current) inputRef.current.value = "";
        if (durationRef.current) durationRef.current.value = "";
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setFile(selected);
      setPreviewUrl(objectUrl);
      setDuration(seconds);
      if (durationRef.current) durationRef.current.value = String(seconds);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("We couldn’t read that audio file. Try an MP3 or M4A.");
      if (inputRef.current) inputRef.current.value = "";
      if (durationRef.current) durationRef.current.value = "";
    };
    audio.src = objectUrl;
  }

  function removeDemo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setFile(null);
    setDuration(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    if (durationRef.current) durationRef.current.value = "";
  }

  return <div className="demo-upload">
    <div className="signup-demo-card">
      <div className="signup-demo-card-head"><span className="signup-demo-icon" aria-hidden="true">♫</span><div><strong>Audio demo showcase</strong><p>Let other musicians hear a sample of your work.</p></div><span className="signup-required-tag">REQUIRED · 1 MIN MAX</span></div>
      <label className="upload-drop signup-upload-drop" htmlFor="demo">
        <span className="upload-icon" aria-hidden="true">↑</span>
        <span><strong>{file ? "Replace your demo" : "Choose an audio demo"}</strong><small>MP3 or M4A · up to 15 MB · max 1 minute</small></span>
        <input ref={inputRef} id="demo" name="demo" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a" required={!file} onChange={(event) => readDuration(event.currentTarget.files?.[0])} />
      </label>
      <input ref={durationRef} type="hidden" name="demoDuration" />
      {file && previewUrl && duration !== null && <div className="signup-demo-selected">
        <div className="signup-demo-file"><span aria-hidden="true">♫</span><div><strong>{file.name}</strong><small>{(file.size / (1024 * 1024)).toFixed(2)} MB · {Math.ceil(duration)} seconds</small></div><button type="button" onClick={removeDemo} aria-label="Remove selected demo">×</button></div>
        <audio controls preload="metadata" src={previewUrl}>Your browser doesn’t support audio playback.</audio>
      </div>}
      {error && <span className="upload-error" role="alert">{error}</span>}
    </div>
  </div>;
}
