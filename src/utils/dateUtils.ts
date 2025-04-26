export function formatPublishedDate(publishedAt: string): string {
  if (!publishedAt || publishedAt === 'Unknown date') {
    return 'Unknown date';
  }

  // If it's already in the "X years/months/days ago" format, return as is
  if (publishedAt.includes('ago')) {
    return publishedAt;
  }

  try {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    } else if (diffMonths > 0) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return 'Today';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return publishedAt; // Return original string if parsing fails
  }
} 