"use client";

import { useState } from "react";

export default function SubjectSelector({
  options,
  selectedSubjects,
  onSubjectsChange,
}: {
  options: string[];
  selectedSubjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      onSubjectsChange(selectedSubjects.filter((s) => s !== subject));
    } else {
      onSubjectsChange([...selectedSubjects, subject]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-left flex items-center justify-between"
      >
        <span className={selectedSubjects.length === 0 ? "text-muted-foreground" : ""}>
          {selectedSubjects.length === 0 ? "请选择任教学科" : `已选择 ${selectedSubjects.length} 门学科`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((subject) => (
            <label key={subject} className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => toggleSubject(subject)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
              />
              <span className="text-sm">{subject}</span>
            </label>
          ))}
        </div>
      )}

      {selectedSubjects.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">已选择：{selectedSubjects.join("、")}</p>
      )}
    </div>
  );
}


