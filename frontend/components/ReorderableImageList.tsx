'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaImage, FaArrowUp, FaArrowDown, FaTrash, FaGripVertical } from 'react-icons/fa';
import { formatBytes } from '@/lib/utils';

interface ReorderableImageListProps {
  images: File[];
  onReorder: (reorderedImages: File[]) => void;
  onRemove: (index: number) => void;
}

export default function ReorderableImageList({
  images,
  onReorder,
  onRemove
}: ReorderableImageListProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Generate preview URLs for the images
  useEffect(() => {
    const urls: string[] = [];
    
    images.forEach(image => {
      const url = URL.createObjectURL(image);
      urls.push(url);
    });
    
    setImageUrls(urls);
    
    // Cleanup function to revoke object URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    // Reorder the images array
    const reorderedImages = Array.from(images);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);
    
    onReorder(reorderedImages);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const reorderedImages = Array.from(images);
    const temp = reorderedImages[index];
    reorderedImages[index] = reorderedImages[index - 1];
    reorderedImages[index - 1] = temp;
    
    onReorder(reorderedImages);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    
    const reorderedImages = Array.from(images);
    const temp = reorderedImages[index];
    reorderedImages[index] = reorderedImages[index + 1];
    reorderedImages[index + 1] = temp;
    
    onReorder(reorderedImages);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-700 mb-2">Arrange Images (Drag to Reorder)</h3>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="image-list">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {images.map((image, index) => (
                <Draggable key={`${image.name}-${index}`} draggableId={`${image.name}-${index}`} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-primary-100"
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="mr-3 text-gray-400 cursor-grab"
                      >
                        <FaGripVertical />
                      </div>
                      
                      <div className="h-16 w-16 flex-shrink-0 mr-3 bg-gray-100 rounded overflow-hidden">
                        {imageUrls[index] ? (
                          <img 
                            src={imageUrls[index]} 
                            alt={`Preview of ${image.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <FaImage className="text-gray-400 text-2xl" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <p className="truncate font-medium text-gray-800">{image.name}</p>
                        <p className="text-sm text-gray-500">{formatBytes(image.size)}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className={`p-2 rounded-full ${
                            index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title="Move up"
                        >
                          <FaArrowUp />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === images.length - 1}
                          className={`p-2 rounded-full ${
                            index === images.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title="Move down"
                        >
                          <FaArrowDown />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => onRemove(index)}
                          className="p-2 rounded-full text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 