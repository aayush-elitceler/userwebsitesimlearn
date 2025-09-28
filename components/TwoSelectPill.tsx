"use client";

import React from "react";
import { ChevronDownIcon } from "lucide-react";
import clsx from "clsx";

type PrimitiveOption = string;
export type OptionWithLabel = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};
export type OptionType = PrimitiveOption | OptionWithLabel;

const isOptionWithLabel = (opt: OptionType): opt is OptionWithLabel =>
  typeof opt === "object" && opt !== null && "label" in opt && "value" in opt;

type SideConfig = {
  label: string;
  displayValue: string | null;
  options: OptionType[];
  showDropdown: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  renderOption?: (opt: OptionWithLabel) => React.ReactNode;
  highlight?: boolean;
  highlightClassName?: string;
};

type TwoSelectPillProps = {
  left: SideConfig;
  right: SideConfig;
  className?: string;
};

const HIGHLIGHT_BASE =
  "absolute -inset-2 rounded-[22px] border-[3px] border-white/70 shadow-[0_0_35px_rgba(255,87,77,0.45)] animate-pulse bg-white/40 pointer-events-none";

export default function TwoSelectPill({ left, right, className }: TwoSelectPillProps) {
  return (
    <div className={className}>
      <div
        className="relative flex items-center gap-3 rounded-[18px] px-4 py-2 shadow-sm"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,247,237,0.95) 0%, rgba(255,233,233,0.95) 100%)",
          boxShadow: "0 6px 20px rgba(255, 90, 72, 0.10)",
        }}
      >
        {/* Left select */}
        <div
          className={clsx(
            "relative dropdown-container rounded-[18px] transition duration-300",
            left.highlight && "scale-[1.02]",
            left.highlightClassName
          )}
        >
          {left.highlight && (
            <span
              className={clsx(
                HIGHLIGHT_BASE,
                "-z-10"
              )}
              aria-hidden="true"
            />
          )}
          <button
            onClick={left.onToggle}
            className={clsx(
              "relative z-10 flex items-center text-[#FF574D]",
              left.highlight && "font-bold"
            )}
          >
            <span className="text-[14px] sm:text-[16px] font-semibold tracking-wide">
              {left.label} : {left.displayValue || "Select"}
            </span>
            <ChevronDownIcon
              className={`ml-2 size-4 transition-transform ${left.showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {left.showDropdown && (
            <div className="absolute mt-2 z-10 bg-white rounded-xl shadow-xl max-h-[300px] overflow-y-auto w-full border border-gray-200 dropdown-container">
              <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100 rounded-t-xl">
                Select {left.label}
              </div>
              {left.options.map((opt) => {
                const key = isOptionWithLabel(opt) ? opt.label : (opt as string);
                const value = isOptionWithLabel(opt) ? opt.value : (opt as string);
                return (
                  <div
                    key={key}
                    className="px-4 py-3 hover:bg-rose-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    onClick={() => left.onSelect(value)}
                  >
                    {isOptionWithLabel(opt) && left.renderOption ? left.renderOption(opt) : key}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          className="w-[2px] h-6 bg-[#FF574D] rounded-full"
          style={{ boxShadow: "0 2px 6px rgba(255, 87, 77, 0.35)" }}
        />

        {/* Right select */}
        <div
          className={clsx(
            "relative dropdown-container rounded-[18px] transition duration-300",
            right.highlight && "scale-[1.02]",
            right.highlightClassName
          )}
        >
          {right.highlight && (
            <span
              className={clsx(
                HIGHLIGHT_BASE,
                "-z-10"
              )}
              aria-hidden="true"
            />
          )}
          <button
            onClick={right.onToggle}
            className={clsx(
              "relative z-10 flex items-center text-[#FF574D]",
              right.highlight && "font-bold"
            )}
          >
            <span className="text-[14px] sm:text-[16px] font-semibold tracking-wide">
              {right.label} : {right.displayValue || "Select"}
            </span>
            <ChevronDownIcon
              className={`ml-2 size-4 transition-transform ${right.showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {right.showDropdown && (
            <div className="absolute mt-2 z-10 bg-white rounded-xl shadow-xl max-h-[300px] overflow-y-auto w-full border border-gray-200 dropdown-container">
              <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100 rounded-t-xl">
                Select {right.label}
              </div>
              {right.options.map((opt) => {
                const key = isOptionWithLabel(opt) ? opt.label : (opt as string);
                const value = isOptionWithLabel(opt) ? opt.value : (opt as string);
                return (
                  <div
                    key={key}
                    className="px-4 py-3 hover:bg-rose-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    onClick={() => right.onSelect(value)}
                  >
                    {isOptionWithLabel(opt) && right.renderOption ? right.renderOption(opt) : key}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


