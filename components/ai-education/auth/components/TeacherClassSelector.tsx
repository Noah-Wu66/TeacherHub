"use client";

import { useState } from "react";

export default function TeacherClassSelector({
  selectedClasses,
  onClassesChange,
}: {
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const allClasses = Array.from({ length: 20 }, (_, i) => `${i + 1}班`);

  const toggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      onClassesChange(selectedClasses.filter((c) => c !== className));
    } else {
      onClassesChange([...selectedClasses, className]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-left flex items-center justify-between"
      >
        <span className={selectedClasses.length === 0 ? "text-muted-foreground" : ""}>
          {selectedClasses.length === 0 ? "请选择管理班级" : `已选择 ${selectedClasses.length} 个班级`}
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
          {allClasses.map((cls) => (
            <label key={cls} className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={selectedClasses.includes(cls)}
                onChange={() => toggleClass(cls)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
              />
              <span className="text-sm">{cls}</span>
            </label>
          ))}
        </div>
      )}

      {selectedClasses.length === 0 && <p className="text-xs text-destructive mt-1.5">请至少选择一个班级以便管理</p>}
      {selectedClasses.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          已选择：{selectedClasses.sort((a, b) => parseInt(a) - parseInt(b)).join("、")}
        </p>
      )}
    </div>
  );
}


