"use client";

import { useState, useRef } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@serp-extensions/ui/components/card";
import Link from "next/link";
import Image from "next/image";
import { icons } from "lucide-react";

import type { ToolCardData } from "@/lib/tool-card";

interface ToolCardProps {
  tool: ToolCardData;
}

const colors = [
  "rgb(239, 68, 68)",   // red-500
  "rgb(245, 158, 11)",  // amber-500
  "rgb(34, 197, 94)",   // green-500
  "rgb(59, 130, 246)",  // blue-500
  "rgb(168, 85, 247)",  // purple-500
  "rgb(236, 72, 153)",  // pink-500
  "rgb(20, 184, 166)",  // teal-500
  "rgb(251, 146, 60)",  // orange-500
  "rgb(99, 102, 241)",  // indigo-500
  "rgb(244, 63, 94)",   // rose-500
  "rgb(14, 165, 233)",  // sky-500
  "rgb(163, 230, 53)",  // lime-400
];

export function ToolCard({ tool }: ToolCardProps) {
  const [borderColor, setBorderColor] = useState<string>("");
  const colorIndexRef = useRef(0);
  const IconComponent = tool.iconName
    ? (icons[tool.iconName as keyof typeof icons] ?? null)
    : null;

  const handleMouseEnter = () => {
    // Cycle through colors sequentially instead of random
    colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
    const color = colors[colorIndexRef.current];
    if (color) {
      setBorderColor(color);
    }
  };

  const handleMouseLeave = () => {
    setBorderColor("");
  };

  return (
    <Link href={tool.href}>
      <Card
        className="group h-full transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-2"
        style={{
          borderColor: borderColor || undefined,
          transition: "all 0.3s ease, border-color 0.2s ease",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-3">
              {tool.imageUrl ? (
                <Image
                  src={tool.imageUrl}
                  alt={tool.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 mt-0.5 rounded-md bg-white object-cover"
                />
              ) : IconComponent ? (
                <IconComponent
                  className="h-6 w-6 mt-0.5 transition-colors duration-300"
                  style={{ color: borderColor || undefined }}
                />
              ) : null}
              <div className="flex-1">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {tool.name}
                </CardTitle>
              </div>
            </div>
            {tool.isPopular && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full whitespace-nowrap">
                Popular
              </span>
            )}
          </div>
          <CardDescription className="line-clamp-2 mb-3">
            {tool.description}
          </CardDescription>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {tool.rating && (
              <span className="flex items-center gap-1">
                ⭐ {tool.rating.toFixed(1)}
              </span>
            )}
            {tool.users && (
              <span>{tool.users}</span>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}