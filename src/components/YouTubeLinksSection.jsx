import React from "react";
import { normalizeYouTubeLinks } from "../utils/youtubeLinks";
import "../styles/youtube-links.css";

export default function YouTubeLinksSection({ movie }) {
  const links = normalizeYouTubeLinks(movie);

  if (!links.length) return null;

  const primary = links[0];
  const secondary = links.slice(1, 5);

  return (
    <section className="youtube-links-section" aria-labelledby="youtube-links-title">
      <div className="youtube-links-header">
        <div>
          <p className="youtube-links-eyebrow">Free to Watch</p>
          <h2 id="youtube-links-title">Watch on YouTube</h2>
        </div>
      </div>

      <a
        className="youtube-primary-button"
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="youtube-primary-main">Watch free on YouTube</span>
        <span className="youtube-primary-sub">
          {primary.label}
          {primary.duration_label ? ` • ${primary.duration_label}` : ""}
          {primary.view_label ? ` • ${primary.view_label}` : ""}
        </span>
      </a>

      <div className="youtube-primary-meta">
        <p>{primary.title}</p>
        {primary.channel ? <span>{primary.channel}</span> : null}
      </div>

      {secondary.length ? (
        <div className="youtube-other-links">
          <h3>Other YouTube versions</h3>

          <div className="youtube-other-list">
            {secondary.map((link) => (
              <a
                key={link.video_id}
                className="youtube-other-item"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="youtube-other-title">{link.title}</span>
                <span className="youtube-other-meta">
                  {link.label}
                  {link.duration_label ? ` • ${link.duration_label}` : ""}
                  {link.view_label ? ` • ${link.view_label}` : ""}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
