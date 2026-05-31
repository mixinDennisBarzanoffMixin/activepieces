import { createContext, createEffect, useContext } from 'solid-js';

const CursorPositionContext = createContext<{
  cursorPosition: { x: number; y: number };
  setCursorPosition: (position: { x: number; y: number }) => void;
}>({
  cursorPosition: { x: 0, y: 0 },
  setCursorPosition: () => {},
});

export const useCursorPosition = () => {
  return useContext(CursorPositionContext);
};

export const CursorPositionProvider = ({ children }: { children: any }) => {
  let cursorPositionRef: { x: number; y: number } | undefined;
  const setCursorPosition = (position: { x: number; y: number }) => {
    cursorPositionRef = position;
  };
  return (
    <CursorPositionContext.Provider
      value={{ cursorPosition: cursorPositionRef, setCursorPosition }}
    >
      {children}
    </CursorPositionContext.Provider>
  );
};

//Use this only in the component you want to re-render when the cursor position changes, i.e dragged step or note
export const useCursorPositionEffect = (
  callback: (position: { x: number; y: number }) => void,
) => {
  createEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      callback({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('pointermove', handleMouseMove);
    return () => {
      window.removeEventListener('pointermove', handleMouseMove);
    };
  });
};
