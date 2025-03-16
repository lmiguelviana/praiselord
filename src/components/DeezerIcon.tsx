// Componente de ícone do Deezer
import React from 'react';

interface DeezerIconProps extends React.SVGProps<SVGSVGElement> {}

export const DeezerIcon: React.FC<DeezerIconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      {...props}
    >
      {/* Barras do logo do Deezer */}
      <rect x="2" y="5" width="6" height="2" rx="0.5" />
      <rect x="9" y="5" width="6" height="2" rx="0.5" />
      <rect x="16" y="5" width="6" height="2" rx="0.5" />
      <rect x="2" y="9" width="6" height="2" rx="0.5" />
      <rect x="9" y="9" width="6" height="2" rx="0.5" />
      <rect x="16" y="9" width="6" height="2" rx="0.5" />
      <rect x="2" y="13" width="6" height="2" rx="0.5" />
      <rect x="9" y="13" width="6" height="2" rx="0.5" />
      <rect x="16" y="13" width="6" height="2" rx="0.5" />
      <rect x="2" y="17" width="6" height="2" rx="0.5" />
    </svg>
  );
};

export default DeezerIcon; 