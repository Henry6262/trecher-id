"use client";

import React, { useRef, useId, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export interface TextPathProps {
  text: string;
  path: string;
  className?: string;
  duration?: number;
  reversed?: boolean;
  fontSize?: string;
  letterSpacing?: string;
  viewBox?: string;
  pathScale?: number;
}

const TextPath: React.FC<TextPathProps> = ({
  text = "Your text goes here",
  path,
  className = "",
  duration = 21,
  reversed = false,
  fontSize = "17px",
  letterSpacing = "normal",
  viewBox = "0 0 240 240",
  pathScale = 1,
}) => {
  const id = useId();
  const pathId = `text-path-curve-${id.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const textPath1Ref = useRef<SVGTextPathElement>(null);
  const textPath2Ref = useRef<SVGTextPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);

  const [textLengthLimit, setTextLengthLimit] = useState<number | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (pathRef.current && measureRef.current) {
      const pathLen = pathRef.current.getTotalLength();
      const textLen = measureRef.current.getComputedTextLength();

      if (textLen > pathLen) {
        setTextLengthLimit(pathLen);
      } else {
        setTextLengthLimit(undefined);
      }
      setIsReady(true);
    }
  }, [text, path, fontSize, letterSpacing]);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        repeat: -1,
        defaults: { ease: "none", duration: duration },
      });

      tl.fromTo(
        textPath1Ref.current,
        { attr: { startOffset: "0%" } },
        { attr: { startOffset: reversed ? "-100%" : "100%" } },
        0,
      );

      tl.fromTo(
        textPath2Ref.current,
        { attr: { startOffset: reversed ? "100%" : "-100%" } },
        { attr: { startOffset: "0%" } },
        0,
      );
    },
    { scope: containerRef, dependencies: [reversed, duration] },
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center ${className}`}
    >
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-60 [&_text]:fill-current [&_text]:font-sans [&_text]:font-medium [&_path]:fill-none [&_path]:stroke-none"
        style={{ transform: `scale(${pathScale})` }}
      >
        <defs>
          <path ref={pathRef} id={pathId} d={path} />
        </defs>

        {/* Hidden text for measurement */}
        <text
          ref={measureRef}
          fill="none"
          stroke="none"
          visibility="hidden"
          fontFamily="sans-serif"
          fontWeight="500"
          fontSize={fontSize}
          letterSpacing={letterSpacing}
          aria-hidden="true"
        >
          {text}
        </text>

        {/* Visible text paths */}
        <text
          fill="currentColor"
          fontFamily="sans-serif"
          fontWeight="500"
          fontSize={fontSize}
          letterSpacing={letterSpacing}
          style={{ opacity: isReady ? 1 : 0 }}
        >
          <textPath
            ref={textPath1Ref}
            href={`#${pathId}`}
            startOffset="0%"
            textLength={textLengthLimit}
            lengthAdjust="spacingAndGlyphs"
          >
            {text}
          </textPath>
          <textPath
            ref={textPath2Ref}
            href={`#${pathId}`}
            startOffset={reversed ? "100%" : "-100%"}
            textLength={textLengthLimit}
            lengthAdjust="spacingAndGlyphs"
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

TextPath.displayName = "TextPath";

export default TextPath;
