import React from 'react';

interface YoutubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  showControls?: boolean;
}

const YoutubeEmbed: React.FC<YoutubeEmbedProps> = ({ 
  videoId, 
  title = 'YouTube video player', 
  className = '', 
  showControls = true 
}) => {
  if (!videoId) return null;

  return (
    <div className={`aspect-video w-full rounded-md overflow-hidden ${className}`}>
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0${showControls ? '' : '&controls=0'}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed; 