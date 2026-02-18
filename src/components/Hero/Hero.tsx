import React from 'react';
import { Button } from '../Button';

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  onSecondaryCtaClick?: () => void;
  backgroundImage?: string;
  overlay?: boolean;
  theme?: {
    primaryColor?: string;
    textColor?: string;
  };
}

export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
  secondaryCtaText,
  secondaryCtaHref,
  onSecondaryCtaClick,
  backgroundImage,
  overlay = true,
  theme = {},
}) => {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="relative" style={bgStyle}>
      {/* Overlay */}
      {overlay && backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {subtitle && (
            <p className={`text-sm md:text-base font-semibold uppercase tracking-wide mb-4 ${backgroundImage ? 'text-blue-300' : 'text-blue-600'}`}>
              {subtitle}
            </p>
          )}
          
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${backgroundImage ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
          
          {description && (
            <p className={`text-lg md:text-xl mb-8 ${backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
              {description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ctaText && (
              <Button
                variant="primary"
                size="lg"
                onClick={onCtaClick}
              >
                {ctaText}
              </Button>
            )}
            {secondaryCtaText && (
              <Button
                variant={backgroundImage ? 'outline' : 'secondary'}
                size="lg"
                onClick={onSecondaryCtaClick}
              >
                {secondaryCtaText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
