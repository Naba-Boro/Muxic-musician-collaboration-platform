"use client";

import { useRef, useState } from "react";

export function AudioDemoInput() {
  const durationRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");

  function readDuration(file?: File) {
    setDuration(null);
    setError("");
    if (!file) return;
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const seconds = audio.duration;
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) {
        setError("Choose a demo that is one minute or shorter.");
        if (durationRef.current) durationRef.current.value = "";
        return;
      }
      setDuration(seconds);
      if (durationRef.current) durationRef.current.value = String(seconds);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("We couldn’t read that audio file. Try an MP3 or M4A.");
    };
    audio.src = objectUrl;
  }

  return (
    <div className="demo-upload">
      <label className="upload-drop" htmlFor="demo">
        <span className="upload-icon" aria-hidden="true">↑</span>
        <span><strong>Choose your demo</strong><small>MP3 or M4A · up to 15 MB · max 1 minute</small></span>
        <input id="demo" name="demo" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a" required onChange={(event) => readDuration(event.currentTarget.files?.[0])} />
      </label>
      <input ref={durationRef} type="hidden" name="demoDuration" />
      {duration !== null && <span className="upload-status" role="status">Demo ready · {Math.ceil(duration)} seconds</span>}
      {error && <span className="upload-error" role="alert">{error}</span>}
    </div>
  );
}
