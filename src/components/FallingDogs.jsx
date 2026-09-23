import React, { useEffect, useState } from 'react';
import './FallingDogs.css';

const DURATION_MIN = 3000;
const DURATION_MAX = 7000;
const DOG_COUNT = 15;

const DOG_IMAGES = [
  '/dogs/dog1.png',
  '/dogs/dog2.png',
  '/dogs/dog3.png',
  '/dogs/dog4.png',
  '/dogs/dog5.png'
];

export default function FallingDogs() {
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    const newDogs = Array.from({ length: DOG_COUNT }).map((_, i) => ({
      id: i,
      image: DOG_IMAGES[Math.floor(Math.random() * DOG_IMAGES.length)],
      left: Math.random() * 100, // 0 to 100 vw
      animationDuration: Math.random() * (DURATION_MAX - DURATION_MIN) + DURATION_MIN,
      animationDelay: Math.random() * 5000,
      size: Math.random() * 40 + 40, // 40px to 80px
      rotation: Math.random() * 360,
    }));
    setDogs(newDogs);
  }, []);

  return (
    <div className="falling-dogs-container">
      {dogs.map(dog => (
        <img
          key={dog.id}
          src={dog.image}
          className="falling-dog"
          style={{
            left: `${dog.left}vw`,
            width: `${dog.size}px`,
            height: `${dog.size}px`,
            animationDuration: `${dog.animationDuration}ms`,
            animationDelay: `${dog.animationDelay}ms`,
            transform: `rotate(${dog.rotation}deg)`
          }}
          alt="Cute Dog"
        />
      ))}
    </div>
  );
}
