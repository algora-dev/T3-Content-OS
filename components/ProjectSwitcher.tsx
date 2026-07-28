"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ProjectOption {
  id: string;
  code: string;
  name: string;
}

export function ProjectSwitcher({ projects }: { projects?: ProjectOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(
    searchParams.get("project") || "all"
  );

  useEffect(() => {
    setSelected(searchParams.get("project") || "all");
  }, [searchParams]);

  function handleChange(value: string) {
    setSelected(value);
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

  return (
    <div className="project-switcher">
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Switch project"
      >
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} - {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
