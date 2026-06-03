import { colorsUtils } from '@/lib/color-utils';

import { ItemMedia } from './item';

function ItemMediaImage(props: ItemMediaImageProps) {
  const backgroundColor = colorsUtils.useAverageColorInImage({
    imgUrl: props.src,
    transparency: 10,
  });

  return (
    <ItemMedia
      variant="icon"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <img src={props.src} alt={props.alt} class="size-6" />
    </ItemMedia>
  );
}

type ItemMediaImageProps = {
  src: string;
  alt: string;
};

export { ItemMediaImage };
