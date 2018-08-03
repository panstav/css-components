$(document).ready(function() {

  $('.js-animate').click(function() {
    const isChecked = $(this).is(':checked');

    $('.js-dots').toggleClass('o-loader--dots', isChecked);
    $('.js-spinner').toggleClass('o-loader--spinner', isChecked);

    if (isChecked) {
      lottie.play();
    } else {
      lottie.stop();
    }
  });

  $('.js-color').change(function() {
    const value = $(this).val();

    if (value) {
      $('.o-loader--dots, .o-loader--spinner').css('color', value);
    }
  });

  $('.js-size').on('change input', function() {
    const size = $(this).val();

    $('.js-lottie').css('width', size);
    $('.js-dots, .js-spinner').css('fontSize', size);
  }).click(function() {
    return false;
  });

  $('.js-speed').on('change input', function() {
    const speed = parseFloat($(this).val());

    lottie.setSpeed(speed + 1);

    const duration = parseFloat(1 / (speed + 1));

    if (isFinite(duration)) {
      $('.js-dots circle, .js-spinner circle').css({
        animationDuration: duration + 's',
        animationPlayState: 'running'
      });
    } else {
      $('.js-dots circle, .js-spinner circle').css('animationPlayState', 'paused');
    }
  });

  const PATTERN_MATRIX = /matrix\([-+]?\d*\.?\d+,[-+]?\d*\.?\d+,[-+]?\d*\.?\d+,[-+]?\d*\.?\d+,([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)\)/;
  const PATTERN_STARTPOINT = /M([-+]?\d*\.?\d*),([-+]?\d*\.?\d*)/;
  const KEYFRAMES = {};
  const LOOP = true;
  const AUTOPLAY = false;
  const SUBFRAME = false;
  const SPEED = 1;
  const initData = (name, x, y) => {
    if (!(name in KEYFRAMES)) {
      KEYFRAMES[name] = {};
      KEYFRAMES[name].X = 0;
      KEYFRAMES[name].Y = 0;
    }

    if (KEYFRAMES[name].X === 0) {
      KEYFRAMES[name].X = x;
    }

    if (KEYFRAMES[name].Y === 0) {
      if (name === 'yellow' && y !== 0) {
        // Compensate for lower starting dot.
        y -= 5;
      }

      KEYFRAMES[name].Y = y;
    }
  };
  const toDegrees = (x, y) => {
    let retVal = Math.atan2(y, x) * 180 / Math.PI + 90;

    if (x < 0 && y < 0) {
      retVal += 360;
    }

    return retVal;
  };
  const addDotsKeyframe = (name, key, x, y) => {
    initData(name, x, y);

    x -= KEYFRAMES[name].X;
    y -= KEYFRAMES[name].Y;

    if (x !== 0 || y !== 0) {
      x = Math.round(x);
      y = Math.round(y);

      if (y === 0) {
        KEYFRAMES[name][key] = `${key}% { transform: translate(${x}px); }`;
      } else {
        KEYFRAMES[name][key] = `${key}% { transform: translate(${x}px, ${y}px); }`;
      }
    }
  };
  const addSpinnerKeyframe = (key, x, y, length, width) => {
    const FACTOR = 0.14800000190734863; // transform original to 80px
    let degrees = toDegrees(x, y);

    degrees = Math.round(degrees - 90); // compensate for stroke start point
    initData('spinner-rotate', 0, 0);
    KEYFRAMES['spinner-rotate'][key] = `${key}% { transform: rotate(${degrees}deg); }`;
    length = Math.round(length * FACTOR);
    initData('spinner-stroke-dasharray', 0, 0);
    KEYFRAMES['spinner-stroke-dasharray'][key] = `${key}% { stroke-dasharray: ${length} 250; }`;
    width = Math.round(width * FACTOR);
    initData('spinner-stroke-width', 0, 0);
    KEYFRAMES['spinner-stroke-width'][key] = `${key}% { stroke-width: ${width}; }`;
  };

  if ($('.js-lottie').length) {
    $('.js-lottie').each(function() {
      const animation = lottie.loadAnimation({
        container: $(this)[0],
        loop: LOOP,
        autoplay: AUTOPLAY,
        path: $(this).data('path')
      });

      animation.setSubframe(SUBFRAME);
      animation.setSpeed(SPEED);

      animation.onEnterFrame = event => {
        const elements = animation.renderer.elements;

        elements.forEach(element => {
          if (animation.animationData.nm.toLowerCase().includes('spinner')) {
            const $svg = $(animation.wrapper);
            const $path = $svg.find('path');
            const path = $path.attr('d') || '';
            const point = path.match(PATTERN_STARTPOINT);

            if (point) {
              const [x, y] = point.slice(1);
              const length = $path[0].getTotalLength();
              const width = $path.attr('stroke-width');

              addSpinnerKeyframe(event.currentTime, parseFloat(x), parseFloat(y), length, parseFloat(width));
            }
          } else {
            const matrix = element.finalTransform.mat.to2dCSS().match(PATTERN_MATRIX);

            if (matrix) {
              const [x, y] = matrix.slice(1);

              addDotsKeyframe(element.data.nm.toLowerCase(), event.currentTime, parseFloat(x), parseFloat(y));
            }
          }
        });
      }

      animation.onLoopComplete = (event) => {
        if (event.currentLoop === 1) {
          Object.keys(KEYFRAMES).forEach(name => {
            let keyframes = `@keyframes zd-${name} {`;
            let keys = Object.keys(KEYFRAMES[name]).filter(key => (key !== 'X' && key !== 'Y'));

            keys.forEach(key => {
              keyframes = `${keyframes}\n  ${KEYFRAMES[name][key]}`;
            });

            keyframes = `${keyframes}\n}`;
            console.log(keyframes);
          });
        }
      }

      animation.addEventListener('DOMLoaded', function() {
        $('.js-animate').triggerHandler('click');
      });
    });
  } else {
    $('.js-animate').triggerHandler('click');
  }
});
