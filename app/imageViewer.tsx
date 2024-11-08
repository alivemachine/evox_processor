import React, { useState, useEffect, useRef } from 'react';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { Button } from '@aws-amplify/ui-react';

interface ImageViewerProps {
  imagePaths: string[];
  onTriggerFunction: () => void;
  onImageChange: (newAngle: string) => void;
  angle?: string; // Optional angle prop
}
const ImageViewer: React.FC<ImageViewerProps> = ({ imagePaths, onTriggerFunction, onImageChange, angle }) => {
  const initialIndex = angle && angle !== 'all' && Array.isArray(imagePaths) 
    ? imagePaths.findIndex(path => path && typeof path === 'string' && path.includes(angle)) 
    : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  console.log(angle);
  useEffect(() => {
    if (angle !== 'all' && Array.isArray(imagePaths)) {
      const newIndex = angle 
        ? imagePaths.findIndex(path => path && typeof path === 'string' && path.includes(angle)) 
        : 0;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  }, [angle, imagePaths]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      currentX.current = e.clientX;
      const deltaX = currentX.current - startX.current;
      if (Math.abs(deltaX) > 10) {
        const newIndex = (currentIndex + Math.sign(deltaX) + imagePaths.length) % imagePaths.length;
        setCurrentIndex(newIndex);
        startX.current = currentX.current;
        const newImagePath = imagePaths[newIndex];
        if (newImagePath) {
          const newAngle = newImagePath.split('_')[1];
          onImageChange(newAngle);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', width: '100%', height: '100%' }}
    >
      {imagePaths.map((path, index) => (
        <div
          key={path || index} // Use index as a fallback key if path is not available
          style={{
            opacity: index === currentIndex ? 1 : 0,
            pointerEvents: 'none', // Prevent images from receiving events
          }}
        >
          {path && path !== '' ? (
            <StorageImage path={path} alt={path} />
          ) : (
            <div style={{ textAlign: 'center', color: 'red' }}><Button onClick={onTriggerFunction}>RUN</Button></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageViewer;