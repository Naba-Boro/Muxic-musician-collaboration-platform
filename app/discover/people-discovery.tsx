"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type Musician = {
  id: string;
  username: string;
  name: string;
  mainSpecialty: string;
  specialties: string[];
  city: string;
  state: string;
  country: string;
  genres: string[];
  bio: string;
  doodle: string;
  avatarUrl: string | null;
  demoUrl: string | null;
  demoDuration: number | null;
};

const pageSize = 12;

function durationLabel(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "Audio demo";
  const safeSeconds = Math.floor(seconds);
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export function PeopleDiscovery({ musicians }: { musicians: Musician[] }) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [shuffleKey, setShuffleKey] = useState(0);
  const [page, setPage] = useState(1);

  const shuffledPeople = useMemo(() => {
    if (shuffleKey === 0) return musicians;
    const result = [...musicians];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, [musicians, shuffleKey]);
  const specialties = [...new Set(musicians.flatMap((person) => [person.mainSpecialty, ...person.specialties]))].sort((a, b) => a.localeCompare(b));
  const genres = [...new Set(musicians.flatMap((person) => person.genres))].sort((a, b) => a.localeCompare(b));
  const filtered = shuffledPeople.filter((person) => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    const matchesSearch = !query || [person.name, person.username, person.mainSpecialty, ...person.specialties, ...person.genres, person.city, person.state, person.country].some((value) => value.toLowerCase().includes(query));
    const matchesSpecialty = !specialty || person.mainSpecialty === specialty || person.specialties.includes(specialty);
    const matchesGenre = !genre || person.genres.includes(genre);
    const matchesLocation = !place || [person.city, person.state, person.country].some((value) => value.toLowerCase().includes(place));
    return matchesSearch && matchesSpecialty && matchesGenre && matchesLocation;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const visiblePeople = filtered.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const hasFilters = Boolean(search || specialty || genre || location);

  function resetFilters() {
    setSearch(""); setSpecialty(""); setGenre(""); setLocation(""); setPage(1);
  }

  return <>
    <div className="discover-heading"><div><span className="discover-kicker"><i /> Musician directory · Pan-India</span><h1>Discover musicians</h1><p>Find vocalists, instrumentalists, producers, and audio professionals across India.</p></div><button className="discover-shuffle" type="button" onClick={() => { setShuffleKey((key) => key + 1); setPage(1); }}><span aria-hidden="true">⤨</span> Shuffle musicians</button></div>

    <section className="discover-filter-card" aria-label="Search and filter musicians">
      <label className="discover-search"><span aria-hidden="true">⌕</span><input aria-label="Search specialty, genre, or location" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search specialty, genre, city..." />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }}>×</button>}</label>
      <div className="discover-filter-grid">
        <label><span>Primary or secondary specialty</span><select value={specialty} onChange={(event) => { setSpecialty(event.target.value); setPage(1); }}><option value="">All specialties</option>{specialties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>Genre</span><select value={genre} onChange={(event) => { setGenre(event.target.value); setPage(1); }}><option value="">All genres</option>{genres.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>City, state, or country</span><input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} placeholder="All locations" /></label>
      </div>
      <div className="discover-filter-footer"><p><i /> Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "musician" : "musicians"}{musicians.length === 100 ? " · first 100 profiles loaded" : ""}</p>{hasFilters && <button type="button" onClick={resetFilters}>Reset filters <span aria-hidden="true">×</span></button>}</div>
    </section>

    {visiblePeople.length ? <div className="discover-people-grid">{visiblePeople.map((person) => <article className="discover-person-card" key={person.id}>
      <div className="discover-person-header"><Link className={`discover-avatar profile-doodle ${person.doodle}`} href={`/profiles/${person.username}`} aria-label={`View ${person.name}'s profile`}>{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : <span aria-hidden="true">♫</span>}</Link><div className="discover-person-title"><Link href={`/profiles/${person.username}`}><h2>{person.name}</h2></Link><span className="discover-handle">@{person.username}</span><span className="discover-location">⌖ {person.city}, {person.state}{person.country !== "India" ? `, ${person.country}` : ""}</span></div></div>
      <div className="discover-primary-specialty"><i /> Primary: {person.mainSpecialty}</div>
      {person.specialties.length > 0 && <div className="discover-tags" aria-label="Additional specialties">{person.specialties.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>}
      {person.genres.length > 0 && <p className="discover-genres"><span>Genres:</span> {person.genres.slice(0, 4).join(" / ")}</p>}
      {person.bio && <p className="discover-bio">{person.bio}</p>}
      {person.demoUrl ? <div className="discover-demo"><div><span aria-hidden="true">♫</span><strong>Profile demo</strong><small>{durationLabel(person.demoDuration)}</small></div><audio controls preload="none" aria-label={`${person.name}'s profile demo`} src={person.demoUrl}>Your browser does not support audio.</audio></div> : <div className="discover-demo-unavailable">No audio demo available</div>}
      <Link className="discover-profile-link" href={`/profiles/${person.username}`}>View profile <span aria-hidden="true">→</span></Link>
    </article>)}</div> : <div className="empty-state"><strong>{musicians.length ? "No musicians match those filters." : "Your music community is getting started."}</strong><p>{musicians.length ? "Try a different specialty, genre, or location." : "Musicians will appear here when they join Muxics."}</p>{hasFilters && <button className="opportunity-reset-link" type="button" onClick={resetFilters}>Clear filters</button>}</div>}

    {filtered.length > pageSize && <nav className="discover-pagination" aria-label="Musician results pages"><span>Showing {(visiblePage - 1) * pageSize + 1}–{Math.min(visiblePage * pageSize, filtered.length)} of {filtered.length}</span><div><button type="button" disabled={visiblePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page {visiblePage} of {totalPages}</span><button type="button" disabled={visiblePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></div></nav>}
  </>;
}
