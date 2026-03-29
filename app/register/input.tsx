"use client";

import React from "react";

interface Props {
  label: string;
  type?: string;
  value: string;
  setValue: (v: string) => void;
  error?: string | false;
  palette: {
    main: string;
    text: string;
    surface: string;
    border: string;
    muted?: string;
  };
}

export default function Input({
  label,
  type = "text",
  value,
  setValue,
  error,
  palette,
}: Props) {
  return (
    <div className="mb-3 text-start">
      <label
        className="form-label fw-semibold"
        style={{ color: palette.text }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`form-control rounded-3 shadow-sm ${error ? "is-invalid" : ""}`}
        placeholder={type === "email" ? "tucorreo@gmail.com" : undefined}
        style={{
          borderColor: palette.border,
          backgroundColor: palette.surface,
        }}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
