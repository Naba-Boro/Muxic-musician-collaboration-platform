"use client";

import { useEffect, useRef, useState } from "react";

const specialties = [
  "Vocalist / singer", "Instrumentalist", "Songwriter", "Lyricist", "Composer",
  "Music producer", "Sound engineer", "Mixing engineer", "Mastering engineer",
  "Arranger", "Beatmaker", "DJ", "Other",
];
const genres = ["Pop", "Rock", "Indie", "Hip-hop", "Electronic", "Classical", "Jazz", "Folk", "Film music", "Other"];

export function SignupProfileFields() {
  const [mainSpecialty, setMainSpecialty] = useState("");
  const [secondarySpecialties, setSecondarySpecialties] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  function toggleValue(value: string, values: string[], update: (next: string[]) => void, limit?: number) {
    if (values.includes(value)) update(values.filter((item) => item !== value));
    else if (limit === undefined || values.length < limit) update([...values, value]);
  }

  return <>
    <fieldset className="signup-choice-group">
      <legend><span>02 / PRIMARY SPECIALTY</span><small>Choose one</small></legend>
      <div className="signup-specialty-grid">
        {specialties.map((item) => <label className={`signup-specialty-option${mainSpecialty === item ? " is-selected" : ""}`} key={item}>
          <input type="radio" name="mainSpecialty" value={item} required checked={mainSpecialty === item} onChange={() => { setMainSpecialty(item); setSecondarySpecialties((values) => values.filter((value) => value !== item)); }} />
          <span className="signup-choice-dot" aria-hidden="true" />{item}
        </label>)}
      </div>
      {mainSpecialty === "Other" && <label className="signup-other-label">What do you do?<input name="mainSpecialtyOther" maxLength={80} placeholder="Describe your main specialty" required /></label>}
    </fieldset>

    <fieldset className="signup-choice-group">
      <legend><span>03 / SECONDARY SKILLS</span><small>{secondarySpecialties.length} of 6 selected</small></legend>
      <p className="signup-help">Choose any additional skills you bring to a project.</p>
      <div className="signup-chip-list">
        {specialties.filter((item) => item !== mainSpecialty).map((item) => {
          const checked = secondarySpecialties.includes(item);
          return <label className={`signup-chip${checked ? " is-selected" : ""}`} key={item}>
            <input type="checkbox" name="secondarySpecialty" value={item} checked={checked} disabled={!checked && secondarySpecialties.length >= 6} onChange={() => toggleValue(item, secondarySpecialties, setSecondarySpecialties, 6)} />
            <span aria-hidden="true">{checked ? "✓" : "+"}</span>{item}
          </label>;
        })}
      </div>
      {secondarySpecialties.includes("Other") && <label className="signup-other-label">Add another skill<input name="secondarySpecialtiesOther" maxLength={80} placeholder="Your additional skill" required /></label>}
    </fieldset>

    <fieldset className="signup-choice-group">
      <legend><span>04 / GENRES</span><small>{selectedGenres.length ? `${selectedGenres.length} selected` : "Choose at least one"}</small></legend>
      <p className="signup-help">Pick the genres you enjoy working in.</p>
      <div className="signup-chip-list signup-genre-list">
        {genres.map((item) => {
          const checked = selectedGenres.includes(item);
          return <label className={`signup-chip${checked ? " is-selected" : ""}`} key={item}>
            <input type="checkbox" name="genre" value={item} checked={checked} required={!selectedGenres.length} onChange={() => toggleValue(item, selectedGenres, setSelectedGenres)} />
            <span aria-hidden="true">{checked ? "✓" : "+"}</span>{item}
          </label>;
        })}
      </div>
      {selectedGenres.includes("Other") && <label className="signup-other-label">Which genre?<input name="genreOther" maxLength={80} placeholder="Add a genre" required /></label>}
    </fieldset>
  </>;
}

export function ProfileAvatarInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseAvatar(file?: File) {
    setError("");
    setPreview("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 256 * 1024) {
      setError("Choose a JPG, PNG, or WebP image up to 256 KB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return <div className="signup-avatar-box">
    <div className="signup-avatar-preview" aria-hidden="true">{preview ? <img src={preview} alt="" /> : <span>♫</span>}</div>
    <div className="signup-avatar-copy"><strong>Profile picture <small>OPTIONAL</small></strong><p>Upload a photo, or we’ll assign a musical doodle.</p>
      <label className="signup-avatar-upload">{preview ? "Replace photo" : "Choose photo"}<input ref={inputRef} type="file" name="avatar" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseAvatar(event.currentTarget.files?.[0])} /></label>
      {error && <span className="upload-error" role="alert">{error}</span>}
    </div>
  </div>;
}
