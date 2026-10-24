"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProjectMessage = { id: string; sender_id: string; body: string; created_at: string };

export function ProjectChat({ projectId, currentUserId, initialMessages, senderNames, canSend }: {
  projectId: string;
  currentUserId: string;
  initialMessages: ProjectMessage[];
  senderNames: Record<string, string>;
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`project-chat-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` }, (payload) => {
        const incoming = payload.new as ProjectMessage;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = body.trim();
    if (!content || sending || !canSend) return;
    setSending(true);
    setError("");
    const supabase = createClient();
    const { data, error: sendError } = await supabase.from("project_messages").insert({
      project_id: projectId,
      sender_id: currentUserId,
      body: content,
    }).select("id,sender_id,body,created_at").single();
    if (sendError) {
      setError("Message wasn’t sent. Check your connection and try again.");
    } else if (data) {
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
      setBody("");
    }
    setSending(false);
  }

  return <section className="project-chat"><div className="project-chat-header"><div><h2>Project conversation</h2><p>Shared with everyone in this project.</p></div><span className="live-indicator">● LIVE</span></div><div className="project-chat-messages">{messages.length ? messages.map((message) => <article className={`chat-message ${message.sender_id === currentUserId ? "chat-message-mine" : ""}`} key={message.id}><div className="chat-message-meta"><strong>{message.sender_id === currentUserId ? "You" : senderNames[message.sender_id] ?? "Account unavailable"}</strong><time>{new Date(message.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time></div><p>{message.body}</p></article>) : <div className="chat-empty"><span aria-hidden="true">♫</span><p>This is your shared project space. Say hello and get started.</p></div>}<div ref={bottomRef} /></div>{canSend ? <form className="project-chat-compose" onSubmit={sendMessage}><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} maxLength={10000} placeholder="Write a message to the project" aria-label="Project message" /><button className="button button-primary" type="submit" disabled={sending || !body.trim()}>{sending ? "Sending…" : "Send"}<span aria-hidden="true">→</span></button>{error && <p className="chat-error" role="alert">{error}</p>}</form> : <p className="chat-closed-note">This project is complete or your participation has ended. The conversation remains available as history.</p>}</section>;
}
