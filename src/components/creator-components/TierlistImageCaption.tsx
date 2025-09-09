"use client"
import React from "react";

interface TierlistImageCaptionProps {
  children: React.ReactNode;
  tierlistImageCaption?: {
    topText?: string;
    bottomText?: string;
    topTextScale?: number;
    bottomTextScale?: number;
    topTextYPos?: number;
    bottomTextYPos?: number;
  };
  hideSVG?: boolean;
}

const TierlistImageCaptionComponent: React.FC<TierlistImageCaptionProps> = ({
  children,
  tierlistImageCaption,
  hideSVG = false,
}) => {
  if (!tierlistImageCaption || hideSVG) {
    return <>{children}</>;
  }

  const {
    topText = "",
    bottomText = "",
    topTextScale = 50,
    bottomTextScale = 50,
    topTextYPos = 10,
    bottomTextYPos = 90,
  } = tierlistImageCaption;

  // Calculate font sizes as percentage of container height
  const topFontSize = topTextScale / 8000;
  const bottomFontSize = bottomTextScale / 8000;

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {children}
      {(topText || bottomText) && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {topText && (
            <text
              x="50"
              y={topTextYPos}
              fontSize={`${topFontSize * 100}em`}
              fontWeight="bold"
              fill="white"
              stroke="black"
              strokeWidth={`${topFontSize }`}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                fontFamily: "Impact, sans-serif",
                paintOrder: "stroke fill markers",
              }}
            >
              {topText}
            </text>
          )}
          
          {bottomText && (
            <text
              x="50"
              y={bottomTextYPos}
              fontSize={`${bottomFontSize * 100}em`}
              fontWeight="bold"
              fill="white"
              stroke="black"
              strokeWidth={`${bottomFontSize}`}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
                fontFamily: "Impact, sans-serif",
                paintOrder: "stroke fill markers",
              }}
            >
              {bottomText}
            </text>
          )}
        </svg>
      )}
    </div>
  );
};

export default TierlistImageCaptionComponent;