"use client";

import { useState, useRef } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@serp-tools/ui/components/card";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    href: string;
    icon: LucideIcon;
  };
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
  const Icon = tool.icon;

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
          <div className="flex items-start gap-3 mb-2">
            <Icon
              className="h-6 w-6 mt-0.5 transition-colors duration-300"
              style={{ color: borderColor || undefined }}
            />
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {tool.name}
            </CardTitle>
          </div>
          <CardDescription className="line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}