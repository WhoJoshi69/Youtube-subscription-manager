import React from "react";
import { BackgroundGradientAnimation } from "../ui/background-gradient-animation";

interface GradientLayoutProps {
  children: React.ReactNode;
  darkMode?: boolean;
}

export function GradientLayout({ children, darkMode = true }: GradientLayoutProps) {
  const colors = darkMode ? {
    gradientBackgroundStart: "rgb(20, 20, 20)",
    gradientBackgroundEnd: "rgb(40, 40, 40)",
    firstColor: "18, 113, 255",
    secondColor: "221, 74, 255",
    thirdColor: "100, 220, 255",
    fourthColor: "200, 50, 50",
    fifthColor: "180, 180, 50",
  } : {
    gradientBackgroundStart: "rgb(240, 240, 240)",
    gradientBackgroundEnd: "rgb(255, 255, 255)",
    firstColor: "18, 113, 255",
    secondColor: "221, 74, 255",
    thirdColor: "100, 220, 255",
    fourthColor: "200, 50, 50",
    fifthColor: "180, 180, 50",
  };

  return (
    <BackgroundGradientAnimation
      {...colors}
      pointerColor="140, 100, 255"
      className="min-h-screen"
    >
      {children}
    </BackgroundGradientAnimation>
  );
} 