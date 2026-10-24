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

export function OpportunityFeed({ opportunities }: { opportunities: Opportunity[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [compensation, setCompensation] = useState("all");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    return opportunities.filter((item) => {
      const matchesSearch = !query || [item.title, item.description, item.specialty, item.poster].some((value) => value.toLowerCase().includes(query));
      const matchesKind = kind === "all" || item.kind === kind;
      const matchesCompensation = compensation === "all" || (compensation === "paid" ? item.kind === "hiring" : item.kind === "collaboration");
      const matchesLocation = !place || item.location.toLowerCase().includes(place);
      return matchesSearch && matchesKind && matchesCompensation && matchesLocation;
    });
  }, [opportunities, search, kind, compensation, location]);

  return (
    <>
      <div className="feed-tools" role="search">
        <label className="feed-search"><span aria-hidden="true">⌕</span><input aria-label="Search opportunities" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles, projects, or skills" /></label>
        <label className="visually-hidden" htmlFor="kindFilter">Opportunity type</label>
        <select id="kindFilter" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All types</option><option value="collaboration">Collaboration</option><option value="hiring">Hiring</option>
        </select>
        <label className="visually-hidden" htmlFor="payFilter">Payment</label>
        <select id="payFilter" value={compensation} onChange={(event) => setCompensation(event.target.value)}>
          <option value="all">Paid and unpaid</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option>
        </select>
        <label className="visually-hidden" htmlFor="locationFilter">Location</label>
        <input className="location-filter" id="locationFilter" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or state" />
      </div>
      <p className="feed-count">{filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}</p>
      {filtered.length ? <div className="gig-grid">
        {filtered.map((gig) => <article className="gig-card" key={gig.id}>
          <div className="gig-card-top">
            <span className="gig-type">{gig.kind}</span>
            {gig.kind === "hiring" && gig.payment !== null && <span className="gig-payment">₹{new Intl.NumberFormat("en-IN").format(gig.payment)}</span>}
          </div>
          <h2><Link href={`/opportunities/${gig.id}`}>{gig.title}</Link></h2>
          <span className="gig-poster">Posted by {gig.poster}</span>
          <p className="gig-description">{gig.description}</p>
          <span className="gig-specialty">Looking for · {gig.specialty}</span>
          <div className="gig-meta"><span>⌖ {gig.location}</span><span>◷ {gig.duration}</span><span>Apply by {new Date(gig.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>
        </article>)}
      </div> : <div className="empty-state"><strong>{opportunities.length ? "No matches this time." : "The next great project starts here."}</strong><p>{opportunities.length ? "Try another specialty, type, or location." : "New opportunities will show up here as musicians post them."}</p>{!opportunities.length && <Link href="/opportunities/new">Post the first opportunity ↗</Link>}</div>}
    </>
  );
}
