import { FloatingDock } from "./ui/floating-dock";
import { 
  Home,
  PlaySquare,
  Users,
  History,
  Film
} from "lucide-react";

type Section = 'playlist' | 'subscriptions' | 'history' | 'trending';

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const navigationItems = [
    {
      title: "Playlists",
      icon: <PlaySquare className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('playlist'),
      isActive: activeSection === 'playlist'
    },
    {
      title: "Subscriptions",
      icon: <Users className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('subscriptions'),
      isActive: activeSection === 'subscriptions'
    },
    {
      title: "History",
      icon: <History className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('history'),
      isActive: activeSection === 'history'
    },
    {
      title: "Trending",
      icon: <Film className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('trending'),
      isActive: activeSection === 'trending'
    },
  ];

  return (
    <FloatingDock
      items={navigationItems}
      desktopClassName="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      mobileClassName="fixed bottom-4 right-4 z-50"
    />
  );
} 