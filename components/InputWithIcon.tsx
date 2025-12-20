"use client";

import React, { InputHTMLAttributes } from "react";

interface InputWithIconProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  icon,
  iconPosition = "left",
  className,
  ...props
}) => {
  return (
    <div className="relative w-full">
      {icon && iconPosition === "left" && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}

      <input
        {...props}
        className={`w-full py-2 px-3 ${
          icon ? (iconPosition === "left" ? "pl-10" : "pr-10") : ""
        } border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors duration-200 ${className}`}
      />

      {icon && iconPosition === "right" && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
    </div>
  );
};

export default InputWithIcon;
