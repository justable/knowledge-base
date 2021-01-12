import React, { useEffect } from 'react';

export default () => {
  useEffect(() => {
    window.addEventListener(
      'click',
      e => {
        console.log('window capture');
        e.stopImmediatePropagation();
      },
      true,
    );
    document.addEventListener(
      'click',
      e => {
        console.log('document capture');
      },
      true,
    );
    document.documentElement.addEventListener(
      'click',
      e => {
        console.log('documentElement capture');
      },
      true,
    );
    window.addEventListener('click', e => {
      console.log('window pop');
    });
    document.documentElement.addEventListener('click', e => {
      console.log('documentElement pop');
    });
    document.addEventListener('click', e => {
      console.log('document pop');
    });
  }, []);
  return (
    <div id="wrapper">
      <a className="link">点我a</a>
      <p>点我p</p>
      <button>点我没反应</button>
    </div>
  );
};
