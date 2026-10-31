"use client";

import React, { useRef, useState } from "react";

export default function Phone3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(10);
  const [rotateY, setRotateY] = useState(-30);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Map cursor offset to 3D rotation angles
    const rY = (x / (rect.width / 2)) * 40; // Max 40 deg Y rotation
    const rX = -(y / (rect.height / 2)) * 30; // Max 30 deg X rotation
    setRotateY(rY);
    setRotateX(rX);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to initial floating perspective position
    setRotateX(10);
    setRotateY(-30);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="iphone-container w-full h-[620px] select-none"
    >
      <div
        className="iphone-3d"
        style={{
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          animation: isHovered ? "none" : undefined,
        }}
      >
        {/* Side physical buttons */}
        <div className="iphone-button action-button"></div>
        <div className="iphone-button volume-up"></div>
        <div className="iphone-button volume-down"></div>
        <div className="iphone-button power-button"></div>

        {/* 3D Extrusion thickness layers */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="iphone-layer"
            style={{ transform: `translateZ(${5 - i * 0.8}px)` }}
          />
        ))}

        {/* Front frame plate */}
        <div className="iphone-frame-front" style={{ transform: "translateZ(5.5px)" }}></div>
        
        {/* Front glass and UI screen content */}
        <div className="iphone-body" style={{ transform: "translateZ(5.5px)" }}>
          <div className="iphone-screen">
            <div className="dynamic-island"></div>
            <div className="ui-content"></div>
          </div>
        </div>

        {/* Back side casing simulation */}
        <div className="iphone-back" style={{ transform: "translateZ(-11.5px)" }}></div>
      </div>
    </div>
  );
}
