// Componente para reprodução de músicas do Deezer
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Headphones, Volume2, VolumeX } from 'lucide-react';

interface DeezerPlayerProps {
  trackId?: number;
  previewUrl?: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

export const DeezerPlayer: React.FC<DeezerPlayerProps> = ({
  trackId,
  previewUrl,
  title,
  artist,
  coverUrl
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  // Abrir Deezer para reprodução completa
  const openDeezer = () => {
    if (trackId) {
      window.open(`https://www.deezer.com/track/${trackId}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Reproduzir/pausar preview da música
  const togglePlayPreview = () => {
    if (!previewUrl) return;

    if (!audio) {
      // Primeira vez que o play é pressionado, criar o elemento de áudio
      const newAudio = new Audio(previewUrl);
      newAudio.volume = 0.5;
      
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
    } else {
      // Toggle play/pause
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Limpar o áudio quando o componente é desmontado
  React.useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  // Se não tiver ID ou Preview, não renderizar
  if (!trackId && !previewUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      {coverUrl && (
        <div 
          className="w-20 h-20 rounded-md overflow-hidden bg-cover bg-center cursor-pointer"
          style={{ backgroundImage: `url(${coverUrl})` }}
          onClick={openDeezer}
        />
      )}
      
      <div className="flex items-center space-x-2">
        {previewUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlayPreview}
            className="flex items-center space-x-1"
          >
            {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span>{isPlaying ? 'Parar' : 'Ouvir Prévia'}</span>
          </Button>
        )}
        
        {trackId && (
          <Button
            size="sm"
            variant="outline"
            onClick={openDeezer}
            className="flex items-center space-x-1"
          >
            <Headphones className="h-4 w-4" />
            <span>Deezer</span>
          </Button>
        )}
      </div>
      
      {showEmbed && trackId && (
        <div className="w-full mt-4">
          <iframe 
            title={`${title} by ${artist}`}
            src={`https://widget.deezer.com/widget/dark/track/${trackId}`}
            width="100%" 
            height="92" 
            frameBorder="0" 
            allowTransparency={true}
            allow="encrypted-media; clipboard-write"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default DeezerPlayer; 