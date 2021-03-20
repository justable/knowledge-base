// https://davidwalsh.name/browser-camera
// https://davidwalsh.name/convert-canvas-image
import React, { useState, useRef, useCallback, RefObject } from 'react';
import PhotoPreview from '@/components/PhotoPreview';
import Camera from '@/components/Camera';
import { Button, message } from 'antd';
import styles from './style.less';

// 整体尺寸以预览的高度为基准
const PREVIEW_HEIGHT = 266;

const CameraAPI: React.FC = () => {
  const [actionCount, setActionCount] = useState(0);
  const onPhotoConfirm = useCallback(
    (canvasRef: RefObject<HTMLCanvasElement>) => {
      if (canvasRef && canvasRef.current) {
        // 输出dataUrl
        message.success('已输出dataUrl到控制台');
        console.log(canvasRef.current.toDataURL('image/png'));
      }
    },
    [],
  );
  const onSnapPhoto = useCallback(() => {
    setActionCount(count => count + 1);
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className={styles.profilePicture}>
      <div className={styles.photoPreviewWrapper}>
        <PhotoPreview
          height={PREVIEW_HEIGHT}
          videoRef={videoRef}
          canvasRef={canvasRef}
          actionCount={actionCount}
        ></PhotoPreview>
        <p className={styles.title}>考试头像</p>
        <p className={styles.subtitle}>
          为了保证考试正常进行，请先安装摄像头设备！
        </p>
        <div className={styles.actions}>
          <Button
            type="primary"
            size="large"
            onClick={() => onPhotoConfirm(canvasRef)}
          >
            确定
          </Button>
        </div>
      </div>
      <div className={styles.cameraWrapper}>
        <Camera width={382} height={382} videoRef={videoRef}></Camera>
        <div className={styles.actions}>
          <Button type="primary" size="large" onClick={onSnapPhoto}>
            拍摄
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraAPI;
