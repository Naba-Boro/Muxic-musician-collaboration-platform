"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  specialty: string;
  duration: string;
  kind: "collaboration" | "hiring";
  payment: number | null;
  location: string;
  deadline: string;
  poster: string;
};

const specialties = [
  "Vocalist / singer", "Instrumentalist", "Songwriter", "Lyricist", "Composer",
  "Music producer", "Sound engineer", "Mixing engineer", "Mastering engineer",
  "Arranger", "Beatmaker", "DJ", "Other",
];

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const isHiring = opportunity.kind === "hiring";

  return (
    <article className="opportunity-card">
      <div className="opportunity-card-banner">
        <span className={isHiring ? "opportunity-type opportunity-type-hiring" : "opportunity-type"}>
          <i aria-hidden="true" />{isHiring ? "Hiring" : "Collaboration"}
          {isHiring && opportunity.payment !== null && <b>₹{new Intl.NumberFormat("en-IN").format(opportunity.payment)} INR</b>}
        </span>
        <span className="opportunity-deadline"><span aria-hidden="true">◷</span> Closes {formatDeadline(opportunity.deadline)} (IST)</span>
      </div>
      <div className="opportunity-card-body">
        <div className="opportunity-card-kicker">
          <span>{opportunity.specialty}</span>
          <span className="opportunity-duration">Est. {opportunity.duration}</span>
        </div>
        <h2><Link href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h2>
        <p className="opportunity-author"><span className="opportunity-avatar" aria-hidden="true">{opportunity.poster.slice(0, 1).toUpperCase()}</span><span><b>{opportunity.poster}</b><small>{opportunity.location}</small></span></p>
        <p className="opportunity-description">{opportunity.description}</p>
        <div className="opportunity-card-footer">
          <span className="opportunity-terms">{isHiring ? "Fixed amount · arranged outside Muxics" : "Collaboration · agree on terms together"}</span>
          <Link className="opportunity-apply" href={`/opportunities/${opportunity.id}`}>View & apply <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}

export function OpportunityFeed({ opportunities }: { opportunities: Opportunity[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [compensation, setCompensation] = useState("all");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sort, setSort] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    return opportunities.filter((item) => {
      const matchesSearch = !query || [item.title, item.description, item.specialty, item.poster, item.location].some((value) => value.toLowerCase().includes(query));
      const matchesKind = kind === "all" || item.kind === kind;
      const matchesCompensation = compensation === "all" || (compensation === "paid" ? item.kind === "hiring" : item.kind === "collaboration");
      const matchesLocation = !place || item.location.toLowerCase().includes(place);
      const matchesSpecialty = !specialty || item.specialty.toLowerCase() === specialty.toLowerCase();
      return matchesSearch && matchesKind && matchesCompensation && matchesLocation && matchesSpecialty;
    });
  }, [opportunities, search, kind, compensation, location, specialty]);
  const sorted = [...filtered].sort((a, b) => sort === "deadline"
    ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    : new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

  function resetFilters() {
    setSearch(""); setKind("all"); setCompensation("all"); setLocation(""); setSpecialty("");
  }

  return (
    <div className="opportunity-workspace">
      <aside className="opportunity-filter-panel" aria-label="Filter opportunities">
        <div className="opportunity-panel-heading"><strong><span aria-hidden="true">☷</span> Filter opportunities</strong><button type="button" onClick={resetFilters}>Reset</button></div>
        <label className="opportunity-filter-label" htmlFor="desktop-kind">Type</label>
        <select id="desktop-kind" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All opportunities</option><option value="collaboration">Collaborations</option><option value="hiring">Hiring</option>
        </select>
        <label className="opportunity-check"><input type="radio" name="compensation" checked={compensation === "all"} onChange={() => setCompensation("all")} />All terms</label>
        <label className="opportunity-check"><input type="radio" name="compensation" checked={compensation === "paid"} onChange={() => setCompensation("paid")} />Paid hiring</label>
        <label className="opportunity-check"><input type="radio" name="compensation" checked={compensation === "unpaid"} onChange={() => setCompensation("unpaid")} />Collaboration</label>
        <label className="opportunity-filter-label" htmlFor="specialtyFilter">Needed role</label>
        <select id="specialtyFilter" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
          <option value="">Any role</option>{specialties.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <label className="opportunity-filter-label" htmlFor="locationFilter">City, state, or country</label>
        <input id="locationFilter" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search location" />
        <div className="opportunity-filter-note">Hiring amounts are arranged directly between musicians in this version of Muxics.</div>
      </aside>

      <section className="opportunity-results" aria-label="Open opportunities">
        <div className="opportunity-mobile-search">
          <label className="opportunity-search"><span aria-hidden="true">⌕</span><input aria-label="Search by role, genre, or keyword" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by role, genre, or keyword..." /></label>
          <button className="opportunity-search-filter" type="button" aria-label="Show filters" aria-expanded={showMobileFilters} onClick={() => setShowMobileFilters((shown) => !shown)}>☷</button>
        </div>
        {showMobileFilters && <div className="opportunity-mobile-filter-options">
          <label>Needed role<select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">Any role</option>{specialties.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
          <label>Paid or unpaid<select value={compensation} onChange={(event) => setCompensation(event.target.value)}><option value="all">All terms</option><option value="paid">Paid hiring</option><option value="unpaid">Collaboration</option></select></label>
          <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or state" /></label>
        </div>}
        <div className="opportunity-mobile-chips" aria-label="Filter opportunity type">
          {[ ["all", "All"], ["collaboration", "Collaborations"], ["hiring", "Hiring (₹)"] ].map(([value, label]) => <button type="button" key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}>{value === "all" ? "●" : value === "hiring" ? "▣" : "◎"} {label}</button>)}
        </div>
        <div className="opportunity-dispatch">
          <div><span className="opportunity-dispatch-label"><i /> Studio dispatch</span><h1>Need session talent?</h1><p>Post a collaboration or hiring opportunity and find musicians for your project.</p></div>
          <Link href="/opportunities/new"><span aria-hidden="true">＋</span> Post opportunity</Link>
        </div>
        <div className="opportunity-results-heading"><p><b>{filtered.length}</b> open {filtered.length === 1 ? "opportunity" : "opportunities"}</p><label>Sort <select aria-label="Sort opportunities" value={sort} onChange={(event) => setSort(event.target.value)}><option value="deadline">Closing soon</option><option value="newest">Later deadline</option></select></label></div>
        {sorted.length ? <div className="opportunity-list">{sorted.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}</div> : <div className="empty-state"><strong>{opportunities.length ? "No opportunities match those filters." : "The next project starts with you."}</strong><p>{opportunities.length ? "Try another role, type, or location." : "New opportunities will appear here when musicians post them."}</p>{opportunities.length ? <button type="button" className="opportunity-reset-link" onClick={resetFilters}>Clear filters</button> : <Link href="/opportunities/new">Post an opportunity ↗</Link>}</div>}
      </section>

      <aside className="opportunity-side-panel">
        <section className="opportunity-side-card">
          <span className="opportunity-side-kicker">Your workspace</span>
          <h2>Keep your projects moving.</h2>
          <p>Track the opportunities you apply to and continue accepted work in your project spaces.</p>
          <Link href="/applications">View my applications <span>→</span></Link>
          <Link href="/projects">Open my projects <span>→</span></Link>
        </section>
        <section className="opportunity-side-note"><span aria-hidden="true">♫</span><div><strong>Built for making music together</strong><p>Each opportunity is for one kind of expert. Posters can accept the number of contributors their project needs.</p></div></section>
      </aside>
    </div>
  );
}
