
"use client";
import React from "react";
import "@/styles/confetti.css";

const Confetti = () => {
  const confetti = Array.from({ length: 150 }).map((_, i) => (
    <div key={i} className={`confetti-${i}`}></div>
  ));

  return <div className="confetti-container">{confetti}</div>;
};

export default Confetti;
