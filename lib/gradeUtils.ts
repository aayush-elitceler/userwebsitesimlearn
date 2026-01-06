// Grade constants and utilities for auto-selecting user grade from profile

export const grades = [
  "1st grade",
  "2nd grade",
  "3rd grade",
  "4th grade",
  "5th grade",
  "6th grade",
  "7th grade",
  "8th grade",
  "9th grade",
  "10th grade",
  "11th grade",
  "12th grade",
  "UG",
  "PG",
];

// Helper function to get ordinal suffix for a number
const getOrdinalSuffix = (value: number): string => {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export const mapClassNameToGradeOption = (
  className?: string | null
): string | null => {
  if (!className) return null;

  const trimmed = className.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();

  // Handle UG/PG directly
  if (normalized === "ug" || normalized === "pg") {
    return normalized.toUpperCase();
  }

  // Handle pure numeric values (e.g., "8", "10")
  if (/^\d+$/.test(normalized)) {
    const numeric = parseInt(normalized, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
      const candidate = `${numeric}${getOrdinalSuffix(numeric)} grade`;
      const match = grades.find(
        (grade) => grade.toLowerCase() === candidate.toLowerCase()
      );
      if (match) return match;
    }
  }

  // Handle values like "8th", "10th"
  if (/^\d+(st|nd|rd|th)$/.test(normalized)) {
    const numeric = parseInt(normalized, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
      const candidate = `${numeric}${getOrdinalSuffix(numeric)} grade`;
      const match = grades.find(
        (grade) => grade.toLowerCase() === candidate.toLowerCase()
      );
      if (match) return match;
    }
  }

  // Exact match
  const exactMatch = grades.find((grade) => grade.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = grades.find((grade) =>
    grade.toLowerCase().startsWith(normalized)
  );
  return partialMatch ?? null;
};

export const gradeToNumeric = (grade: string | null): number | null => {
  if (!grade) return null;

  const normalized = grade.toLowerCase();

  // UG/PG aren't numeric
  if (normalized === "ug" || normalized === "pg") {
    return null;
  }

  // Extract number from grade string
  const match = grade.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
};


export const getUserGradeFromProfile = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const profileData = localStorage.getItem("user-profile");
    if (profileData) {
      const profile = JSON.parse(profileData);
      // Profile may have `className` or `class` field
      const className = profile?.className || profile?.class;
      if (className) {
        return mapClassNameToGradeOption(className);
      }
    }
  } catch (error) {
    console.error("Error getting grade from profile:", error);
  }

  return null;
};

export const getUserGradeNumericFromProfile = (): number | null => {
  const grade = getUserGradeFromProfile();
  return gradeToNumeric(grade);
};
