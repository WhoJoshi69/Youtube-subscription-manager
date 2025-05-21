import { FloatingDock } from "./ui/floating-dock";
import { 
  Home as HomeIcon,
  PlaySquare,
  Users,
  Film,
  User,
  List,
  Star
} from "lucide-react";

type Section = 'home' | 'playlist' | 'subscriptions' | 'trending' | 'people' | 'lists' | 'special';

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const navigationItems = [
    {
      title: "Home",
      icon: <HomeIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('home'),
      isActive: activeSection === 'home'
    },
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
      title: "Trending",
      icon: <Film className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('trending'),
      isActive: activeSection === 'trending'
    },
    {
      title: "People",
      icon: <User className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('people'),
      isActive: activeSection === 'people'
    },
    {
      title: "Lists",
      icon: <List className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('lists'),
      isActive: activeSection === 'lists'
    },
    {
      title: "Special",
      icon: <Star className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => onSectionChange('special'),
      isActive: activeSection === 'special'
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