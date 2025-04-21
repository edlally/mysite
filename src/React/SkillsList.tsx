import React, { useState, useCallback } from "react";

// Define types for our components
interface CategoryIconProps {
  category: string;
}

interface SkillItemsProps {
  items: string[];
  isOpen: boolean;
}

// Memoize individual category icons to prevent unnecessary re-renders
const CategoryIcon = React.memo(({ category }: CategoryIconProps) => {
  switch(category) {
    case "Web Development":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 skills-theme-icon"
          style={{ color: 'var(--sec)' }}
        >
          <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 11H4V19H20V11ZM20 5H4V9H20V5ZM11 6V8H9V6H11ZM7 6V8H5V6H7Z"></path>
        </svg>
      );
    case "Blender animations":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 skills-theme-icon"
          style={{ color: 'var(--sec)' }}
        >
          <path d="M12 2L6.5 11 2 16H12L17.5 11 22 16H12V22H2V16L12 2ZM12 16L17.5 11 22 16H12Z"></path>
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 skills-theme-icon"
          style={{ color: 'var(--sec)' }}
        >
          <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"></path>
        </svg>
      );
  }
});

// Memoize the skill items to prevent unnecessary re-renders
const SkillItems = React.memo(({ items, isOpen }: SkillItemsProps) => {
  if (!isOpen) return null;
  
  return (
    <ul className="space-y-2 text-[var(--white-icon)] text-sm pt-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="pl-1">•</span>
          <li className="pl-3">{item}</li>
        </div>
      ))}
    </ul>
  );
});

const SkillsListBase = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const skills = {
    "Web Development": [
      "Static sites with Astro",
      "UI animations",
      "Interactive portfolio websites",
    ],
    "Blender animations": [
      "Hard surface modeling and animation",
      "Custom python scripting",
      "Custom addon creation"
    ],
    "I need another skill here": [
      "skill 1",
      "skill 2",
      "skill 3",
    ],
  };

  const toggleItem = useCallback((item: string) => {
    setOpenItem(prevItem => prevItem === item ? null : item);
  }, []);

  return (
    <div className="text-left pt-3 md:pt-9">
      <h3 className="text-[var(--white)] text-3xl md:text-4xl font-semibold md:mb-6">
        What I do?
      </h3>
      <ul className="space-y-4 mt-4 text-lg">
        {Object.entries(skills).map(([category, items]) => (
          <li key={category} className="w-full">
            <div
              onClick={() => toggleItem(category)}
              className="md:w-[400px] w-full bg-[#1414149c] rounded-2xl text-left hover:bg-opacity-80 transition-all border border-[var(--white-icon-tr)] cursor-pointer overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4">
                <CategoryIcon category={category} />
                <div className="flex items-center gap-2 flex-grow justify-between">
                  <div className="min-w-0 max-w-[200px] md:max-w-none overflow-hidden">
                    <span className="block truncate text-[var(--white)] text-lg">
                      {category}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`w-6 h-6 text-[var(--white)] transform transition-transform flex-shrink-0 ${
                      openItem === category ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>
                  </svg>
                </div>
              </div>

              <div
                className={`px-4 transform-gpu ${
                  openItem === category
                    ? "max-h-[500px] pb-4 opacity-100"
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
                style={{ 
                  transition: 'max-height 0.3s ease, opacity 0.2s ease',
                  willChange: 'max-height, opacity'
                }}
              >
                <SkillItems items={items} isOpen={openItem === category} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(SkillsListBase);
