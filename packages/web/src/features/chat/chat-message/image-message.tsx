import { Download } from 'lucide-solid';

import ImageWithFallback from '@/components/custom/image-with-fallback';

interface ImageMessageProps {
  content: string;
  setSelectedImage: (image: string | null) => void;
}

export const ImageMessage = (props: ImageMessageProps) => {
  return (
    <div class="w-fit">
      <div class="relative group">
        <ImageWithFallback
          src={props.content}
          alt="Received image"
          class="w-80 h-auto rounded-md cursor-pointer"
          onClick={() => props.setSelectedImage(props.content)}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            const link = document.createElement('a');
            link.href = props.content;
            link.download = 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          class="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
        >
          <Download class="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
};
