import React from 'react';

interface TestButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function TestButton({ onClick, children }: TestButtonProps) {
  const handleClick = () => {
    console.log('TestButton clicado!');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {children}
    </button>
  );
}