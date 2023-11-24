import imageInference from './tfjs-face.js'

// const image = document.querySelector('img')
const video = document.getElementById('video')

const setupCamera = async function () {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available'
    )
  }

  const targetFPS = 60
  const $size = {
    width: 640,
    height: 480
  }
  const videoConfig = {
    audio: false,
    video: {
      facingMode: 'user',
      // Only setting the video to a specified size for large screen, on
      // mobile devices accept the default size.
      width: $size.width,
      height: $size.height,
      frameRate: {
        ideal: targetFPS
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(videoConfig)
  
  return stream
}

video.srcObject = await setupCamera()

video.play()

// let originalArray = [
//   [[1, 1, 1], [2, 2, 2]],
//   [[1, 1, 1], [2, 2, 2]],
//   [[1, 1, 1], [2, 2, 2]]
// ];

// let modifiedArray = originalArray.map(subArray => subArray.slice(1));

// console.log(modifiedArray);


/*
  video：传入视频流  --必传项
  userId：渠道码  --必传项（请使用示例值）
  img：标准图片
  code: 授权码  --必传项（请使用示例值）
  freCnt：推理频率  --非必传项，不传默认为500毫秒，即每秒推理2次
*/
const userId = "1018"
const code = "kLhtDpdRFIojo6VSwXZ5myUFycvJUHey3xLqnQFVqsCW1qYg4Rh/aplH0pHraTPZ9NTg5+W/tlKUwZtq7yXtPg=="
const freCnt = 3000
const img = document.getElementById('myImg');
// const img2 = document.getElementById('myImg2');
imageInference(img, userId, code, data => {
  console.log(data)
}, freCnt)
