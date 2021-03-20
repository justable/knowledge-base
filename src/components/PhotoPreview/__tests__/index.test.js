import React, { useState, useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import PhotoPreview from '..';

describe('PhotoPreview', () => {
  const imgUrl = 'https://www.w3school.com.cn/i/eg_tulip.jpg';
  const videoUrl = 'https://www.w3school.com.cn/i/movie.ogg';

  let previewHeight = 240;

  let originVideoWidth, originVideoHeight;

  let fake2dContext = () => {
    return {
      drawImage(target) {
        if (target instanceof HTMLImageElement) {
          expect(target.src).toBe(imgUrl);
        } else if (target instanceof HTMLVideoElement) {
          expect(target.src).toBe(videoUrl);
        } else {
          return null;
        }
      },
    };
  };

  beforeAll(() => {
    originVideoWidth = Object.getOwnPropertyDescriptor(
      HTMLVideoElement.prototype,
      'videoWidth',
    ).get;
    originVideoHeight = Object.getOwnPropertyDescriptor(
      HTMLVideoElement.prototype,
      'videoHeight',
    ).get;
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      get() {
        return 640;
      },
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      get() {
        return 480;
      },
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      get() {
        return fake2dContext;
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      get: originVideoWidth,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      get: originVideoHeight,
    });
  });

  it('Render video correctly', async () => {
    let videoRef, canvasRef;
    const Demo = () => {
      const [actionCount, setActionCount] = useState(0);
      videoRef = useRef(null);
      canvasRef = useRef(null);

      function drawFrameOfVideo() {
        setActionCount(count => count + 1);
      }
      return (
        <div>
          <PhotoPreview
            height={previewHeight}
            videoRef={videoRef}
            canvasRef={canvasRef}
            actionCount={actionCount}
          ></PhotoPreview>
          <video ref={videoRef} src={videoUrl}></video>
          <button onClick={drawFrameOfVideo}>test{actionCount}</button>
        </div>
      );
    };
    render(<Demo></Demo>);

    const button = screen.getByText('test0');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(button.textContent).toBe('test1');

    expect(canvasRef.current).toHaveStyle({
      transform: 'scale(0.5) translateX(-50%)',
    });
  });

  it('Render image correctly', () => {
    let imageRef, canvasRef;
    const Demo = () => {
      imageRef = useRef(null);
      canvasRef = useRef(null);

      return (
        <div>
          <PhotoPreview
            height={previewHeight}
            imageRef={imageRef}
            canvasRef={canvasRef}
          ></PhotoPreview>
          <img ref={imageRef} src={imgUrl}></img>
        </div>
      );
    };
    render(<Demo></Demo>);
  });

  it('Render src correctly', () => {
    let canvasRef;
    const Demo = () => {
      canvasRef = useRef(null);

      return (
        <div>
          <PhotoPreview
            height={previewHeight}
            src={imgUrl}
            canvasRef={canvasRef}
          ></PhotoPreview>
        </div>
      );
    };
    render(<Demo></Demo>);
  });
});
