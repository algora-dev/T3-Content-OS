"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  brand_color?: string;
}

export function ProjectSwitcher({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(searchParams.get("project") || "all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(searchParams.get("project") || "all");
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setSelected(value);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("project");
    } else {
      params.set("project", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  const selectedProject = projects.find((p) => p.id === selected);

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
          {selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "All projects"}
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
          <button
            className={`project-switcher-option ${selected === "all" ? "active" : ""}`}
            onClick={() => handleChange("all")}
          >
            <span className="project-dot project-dot-all" />
            <span>All projects</span>
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              className={`project-switcher-option ${selected === p.id ? "active" : ""}`}
              onClick={() => handleChange(p.id)}
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
