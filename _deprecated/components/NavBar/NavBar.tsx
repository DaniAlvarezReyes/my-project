import React, { useState } from 'react';
import { Button } from '../Button';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavBarProps {
  logo?: string;
  siteName?: string;
  links?: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export const NavBar: React.FC<NavBarProps> = ({
  logo,
  siteName = 'My Store',
  links = [],
  ctaText,
  ctaHref,
  onCtaClick,
  theme = {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bgColor = theme.backgroundColor || 'bg-white';
  const textColor = theme.textColor || 'text-gray-800';

  return (
    <nav className={`${bgColor} shadow-md sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            {logo && (
              <img src={logo} alt={siteName} className="h-8 w-auto" />
            )}
            <span className={`text-xl font-bold ${textColor}`}>{siteName}</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`${textColor} hover:opacity-70 transition-opacity font-medium`}
              >
                {link.label}
              </a>
            ))}
            {ctaText && (
              <Button
                variant="primary"
                size="sm"
                onClick={onCtaClick}
              >
                {ctaText}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${textColor} p-2`}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`block ${textColor} hover:opacity-70 transition-opacity font-medium py-2`}
              >
                {link.label}
              </a>
            ))}
            {ctaText && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={onCtaClick}
              >
                {ctaText}
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
