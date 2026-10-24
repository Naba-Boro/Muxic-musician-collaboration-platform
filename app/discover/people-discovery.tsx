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
  doodle: string;
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function PeopleDiscovery({ musicians }: { musicians: Musician[] }) {
  const [people] = useState(() => shuffle(musicians));
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [shuffleKey, setShuffleKey] = useState(0);
  const shuffledPeople = useMemo(() => shuffleKey === 0 ? people : shuffle(people), [people, shuffleKey]);
  const specialties = [...new Set(people.flatMap((person) => [person.mainSpecialty, ...person.specialties]))].sort();
  const filtered = shuffledPeople.filter((person) => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    const matchesSearch = !query || [person.name, person.username, person.mainSpecialty, ...person.specialties, ...person.genres].some((value) => value.toLowerCase().includes(query));
    const matchesSpecialty = !specialty || person.mainSpecialty === specialty || person.specialties.includes(specialty);
    const matchesLocation = !place || [person.city, person.state, person.country].some((value) => value.toLowerCase().includes(place));
    return matchesSearch && matchesSpecialty && matchesLocation;
  });
  return <>
    <div className="feed-tools" role="search"><label className="feed-search"><span aria-hidden="true">⌕</span><input aria-label="Search musicians" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search musicians, skills, or genres" /></label><label className="visually-hidden" htmlFor="specialtyFilter">Specialty</label><select id="specialtyFilter" value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select><label className="visually-hidden" htmlFor="peopleLocationFilter">Location</label><input className="location-filter" id="peopleLocationFilter" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or state" /><button type="button" className="shuffle-button" onClick={() => setShuffleKey((key) => key + 1)}>↻ Shuffle</button></div>
    <p className="feed-count">{filtered.length} {filtered.length === 1 ? "musician" : "musicians"}</p>
    {filtered.length ? <div className="people-grid">{filtered.map((person) => <article className="person-card" key={person.id}><Link className={`profile-doodle ${person.doodle}`} href={`/profiles/${person.username}`} aria-hidden="true">♫</Link><div className="person-card-main"><Link href={`/profiles/${person.username}`}><h2>{person.name}</h2></Link><p>{person.mainSpecialty}</p><span className="person-place">⌖ {person.city}, {person.state}</span><div className="person-tags">{person.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div></div><Link className="person-arrow" href={`/profiles/${person.username}`} aria-label={`View ${person.name}'s profile`}>↗</Link></article>)}</div> : <div className="empty-state"><strong>No musicians match those filters.</strong><p>Try another specialty or location.</p></div>}
  </>;
}
