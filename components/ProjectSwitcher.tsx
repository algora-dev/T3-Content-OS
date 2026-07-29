"use client";

import { useState, useRef, useEffect } from "react";

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  brand_color?: string;
}

interface ActiveProject {
  id: string;
  code: string;
  name: string;
}

export function ProjectSwitcher({
  projects,
  activeProject,
  onSwitch,
}: {
  projects: ProjectOption[];
  activeProject: ActiveProject | null;
  onSwitch: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(projectId: string) {
    setOpen(false);
    onSwitch(projectId);
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  const selectedProject = activeProject
    ? projects.find((p) => p.id === activeProject.id)
    : null;

  return (
    <div className="project-switcher" ref={ref}>
      <button
        className="project-switcher-btn"
        onClick={() => setOpen(!open)}
        aria-label="Switch project"
        aria-expanded={open}
      >
        {selectedProject ? (
          <span
            className="project-dot"
            style={{ backgroundColor: selectedProject.brand_color || "#111820" }}
          />
        ) : (
          <span className="project-dot project-dot-all" />
        )}
        <span className="project-switcher-label">
          {selectedProject
            ? `${selectedProject.code} - ${selectedProject.name}`
            : "Select project"}
        </span>
        <svg
          className={`project-switcher-chevron ${open ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="project-switcher-menu">
          {projects.map((p) => (
            <button
              key={p.id}
              className={`project-switcher-option ${activeProject?.id === p.id ? "active" : ""}`}
              onClick={() => handleSelect(p.id)}
            >
              <span
                className="project-dot"
                style={{ backgroundColor: p.brand_color || "#111820" }}
              />
              <span>{p.code} - {p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
