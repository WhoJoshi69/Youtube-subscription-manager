import React from 'react';
import { X, Users, Calendar, Video } from 'lucide-react';
import { formatSubscriberCount } from '../utils/formatters';

interface ChannelInfoPopupProps {
  channel: {
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
    description?: string;
    videoCount?: string;
    joinedDate?: string;
  };
  onClose: () => void;
}

const ChannelInfoPopup: React.FC<ChannelInfoPopupProps> = ({ channel, onClose }) => {
  return (
    <div className="fixed top-24 left-6 z-50 animate-slide-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 overflow-hidden">
        {/* Header with close button */}
        <div className="relative h-24 bg-gradient-to-r from-red-600 to-red-700">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Channel Info */}
        <div className="px-4 pb-4">
          {/* Channel Image */}
          <div className="relative -mt-12 mb-2">
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800"
            />
          </div>

          {/* Channel Name */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
            {channel.title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{channel.subscriberCount}</span>
            </div>
            {channel.videoCount && (
              <div className="flex items-center gap-1">
                <Video size={16} />
                <span>{channel.videoCount} videos</span>
              </div>
            )}
          </div>

          {/* Joined Date */}
          {channel.joinedDate && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <Calendar size={16} />
              <span>Joined {channel.joinedDate}</span>
            </div>
          )}

          {/* Description */}
          {channel.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                {channel.description}
              </p>
              {channel.description.length > 150 && (
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1">
                  Read more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelInfoPopup; 