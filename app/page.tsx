const notes = [
  { className: "note note-one", glyph: "♫" },
  { className: "note note-two", glyph: "♪" },
  { className: "note note-three", glyph: "♬" },
  { className: "note note-four", glyph: "♪" },
];

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="topbar" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="Muxics home">
          <span className="brand-mark" aria-hidden="true">m</span>
          muxics<span className="brand-period">.</span>
        </a>
        <div className="nav-links">
          <a href="#discover">Discover</a>
          <a href="#about">About</a>
        </div>
        <a className="nav-cta" href="#discover">Find your sound <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT FAVORITE THING</div>
          <h1>Life sounds<br />better <span>together.</span></h1>
          <p className="hero-description">A little corner of the internet for big feelings, good songs, and the people who get it.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#discover">Come on in <span aria-hidden="true">→</span></a>
            <a className="text-link" href="#about">What is Muxics? <span aria-hidden="true">↗</span></a>
          </div>
          <div className="tiny-note"><span aria-hidden="true">✳</span> Made for music people, by music people</div>
        </div>

        <div className="hero-art" aria-label="Colorful hand-drawn music player and music notes" role="img">
          <div className="sunburst" />
          <div className="scribble scribble-left">〰</div>
          {notes.map((note) => <span key={note.className} className={note.className} aria-hidden="true">{note.glyph}</span>)}
          <span className="sparkle sparkle-one" aria-hidden="true">✳</span>
          <span className="sparkle sparkle-two" aria-hidden="true">✦</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="player-card">
            <div className="player-topline"><span>NOW PLAYING</span><span>•••</span></div>
            <div className="record-wrap">
              <div className="record"><div className="record-label"><span>mx</span></div></div>
              <div className="record-arm"><i /></div>
            </div>
            <div className="track-info"><div><strong>Good Things</strong><span>The Sunroom Kids</span></div><span className="heart" aria-hidden="true">♥</span></div>
            <div className="progress"><span /></div>
            <div className="player-controls"><span aria-hidden="true">↶</span><span className="play" aria-hidden="true">▶</span><span aria-hidden="true">↷</span></div>
          </div>
          <div className="sticker sticker-spark">GOOD<br />VIBES<br /><span>ONLY</span></div>
          <div className="sticker sticker-flower" aria-hidden="true"><span>✿</span></div>
          <div className="caption-pill"><span className="caption-icon">♫</span> the soundtrack to your next chapter</div>
        </div>
      </section>

      <section className="bottom-strip" id="discover">
        <div className="strip-copy"><span className="strip-spark" aria-hidden="true">✳</span><div><strong>There’s a song for that.</strong><span>And probably someone else feeling it too.</span></div></div>
        <div className="genre-list" aria-label="Music for every mood"><span>indie daydreams</span><i>✳</i><span>kitchen dancing</span><i>✳</i><span>main character walks</span></div>
        <a className="strip-link" href="#about" aria-label="Learn about Muxics">↗</a>
      </section>
      <footer id="about"><span>muxics<span className="brand-period">.</span></span><span>A softer place to land between songs.</span><span>© 2025 Muxics</span></footer>
    </main>
  );
}
