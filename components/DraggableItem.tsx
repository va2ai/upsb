import React from 'react';

interface DraggableItemProps {
  phrase: string;
  isIncorrect: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ phrase, isIncorrect }) => {

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', phrase);
    e.dataTransfer.effectAllowed = 'move';
  };

  const animationClass = isIncorrect ? 'animate-shake border-red-500' : 'border-transparent';

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      <div
        draggable="true"
        onDragStart={handleDragStart}
        className={`p-3 bg-gray-50 border-2 ${animationClass} rounded-md shadow-sm cursor-grab active:cursor-grabbing text-sm text-gray-700 transition-all duration-200 hover:shadow-md hover:bg-yellow-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-yellow-900`}
      >
        <span>{phrase}</span>
      </div>
    </>
  );
};

export { DraggableItem };