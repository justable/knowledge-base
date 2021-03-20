import React, { useEffect, useMemo, RefObject } from 'react';
import {
  DRAWING_VIDEO_TYPE,
  DRAWING_IMAGE_TYPE,
  DRAWING_STRING_TYPE,
  DRAWING_NONE_TYPE,
} from './DrawingSymbols';
import styles from './style.less';

/**
 * width：照片预览的宽度
 * height：照片预览的高度
 * actionCount：当根据video渲染图片是，actionCount变化才会截取video帧画入canvas
 * imageRef：image元素的ref对象，如果有的话说明是根据image渲染图片
 * videoRef：video元素的ref对象，如果有的话说明是根据video渲染图片
 * canvasRef：canvas元素的ref对象
 */
interface PhotoPreviewProps {
  width?: number;
  height: number;
  actionCount?: number;
  src?: string;
  imageRef?: RefObject<HTMLImageElement>;
  videoRef?: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
}
const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  width,
  height,
  videoRef,
  imageRef,
  src,
  actionCount = 0,
  canvasRef,
}) => {
  // 绘制源的类型
  const drawingType = resolveDrawingType(imageRef, videoRef, src);
  // 绘制源
  const drawingTarget = resolveDrawingTarget(imageRef, videoRef, src);
  // 设置canvas的尺寸和绘制源一样，之后会缩放
  const [canvasWidth, canvasHeight] = resolveCanvasRect(drawingTarget);

  // 缩放比，为了自适应高度到父节点的高度
  const scale = useMemo(() => {
    return canvasHeight > 0 ? height / canvasHeight : 1;
  }, [canvasHeight]);

  useEffect(() => {
    if (
      drawingType !== DRAWING_IMAGE_TYPE ||
      !canvasRef.current ||
      !drawingTarget
    ) {
      return;
    }
    const context2D = canvasRef.current.getContext('2d');
    if (context2D) {
      context2D.drawImage(
        drawingTarget,
        0,
        0,
        (drawingTarget as HTMLImageElement).width,
        (drawingTarget as HTMLImageElement).height,
      );
    }
  }, [scale]);

  useEffect(() => {
    if (
      drawingType !== DRAWING_VIDEO_TYPE ||
      !canvasRef.current ||
      !drawingTarget
    ) {
      return;
    }
    const context2D = canvasRef.current.getContext('2d');
    if (actionCount > 0 && context2D) {
      context2D.drawImage(
        drawingTarget,
        0,
        0,
        (drawingTarget as HTMLVideoElement).videoWidth,
        (drawingTarget as HTMLVideoElement).videoHeight,
      );
    }
  }, [actionCount]);

  return (
    <div
      className={styles.photoPreview}
      style={{
        width: width || height,
        height: height,
      }}
    >
      <canvas
        width={canvasWidth}
        height={canvasHeight}
        ref={canvasRef}
        style={{
          transform: `scale(${scale}) translateX(-50%)`,
        }}
      ></canvas>
    </div>
  );
};

function resolveCanvasRect(
  drawingTarget: HTMLImageElement | HTMLVideoElement | null,
) {
  if (!drawingTarget) {
    return [0, 0];
  }
  let canvasWidth, canvasHeight;

  if (drawingTarget instanceof HTMLImageElement) {
    canvasWidth = drawingTarget.width;
    canvasHeight = drawingTarget.height;
  } else if (drawingTarget instanceof HTMLVideoElement) {
    canvasWidth = drawingTarget.videoWidth;
    canvasHeight = drawingTarget.videoHeight;
  } else {
    return [0, 0];
  }
  return [canvasWidth, canvasHeight];
}

const resolveDrawingType = (
  imageRef?: RefObject<HTMLImageElement>,
  videoRef?: RefObject<HTMLVideoElement>,
  src?: string,
) => {
  if (!!imageRef) {
    return DRAWING_IMAGE_TYPE;
  } else if (!!videoRef) {
    return DRAWING_VIDEO_TYPE;
  } else if (!!src) {
    return DRAWING_STRING_TYPE;
  } else {
    return DRAWING_NONE_TYPE;
  }
};
const resolveDrawingTarget = (
  imageRef?: RefObject<HTMLImageElement>,
  videoRef?: RefObject<HTMLVideoElement>,
  src?: string,
) => {
  if (!!imageRef) {
    return imageRef.current;
  } else if (!!videoRef) {
    return videoRef.current;
  } else if (!!src) {
    const image = new Image();
    image.src = src;
    return image;
  } else {
    return null;
  }
};

export default PhotoPreview;
