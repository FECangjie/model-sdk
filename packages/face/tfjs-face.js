import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'

import * as tf from '@tensorflow/tfjs'

import { decrypt } from './crypto.js'

let model
let interval
let analysis_gap

function l2Norm(tensor, axis = 1) {
  const norm = tf.norm(tensor, 2, axis, true);
  return tf.div(tensor, norm);
}

function cosSim(a, b) {
  const dotProduct = tf.dot(a,b)
  const normA = tf.norm(a);
  const normB = tf.norm(b);
  return dotProduct.div(normA.mul(normB)).dataSync()[0];
}

async function fetchData(para) {
  return new Promise(resolve => {
    setTimeout(() => {
      let n = model.execute(para)
      resolve(n);
    }, 0);
  });
}

async function getScore(a, b) {
  const canvas1 = document.createElement('canvas');
  canvas1.width = a.width;
  canvas1.height = a.height;
  const ctx1 = canvas1.getContext('2d');
  ctx1.drawImage(a, 0, 0, canvas1.width, canvas1.height)
  // fromPixel 将画布数据转换为张量
  let input_data = tf.browser.fromPixels(canvas1)
  // 张量预处理
  input_data = input_data.resizeBilinear([112, 112],false,true)
  input_data = tf.transpose(input_data, [2, 0, 1])
  input_data = input_data.expandDims()
  input_data = input_data.div(255).sub(0.5).div(0.5)
  const tensor1 = tf.round(tf.mul(input_data, 10000)).div(10000);

  const canvas2 = document.createElement('canvas');
  canvas2.width = b.width;
  canvas2.height = b.height;
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(b, 0, 0, canvas2.width, canvas2.height)
  // fromPixel 将画布数据转换为张量
  let input_data2 = tf.browser.fromPixels(canvas2)
  // 张量预处理
  input_data2 = input_data2.resizeBilinear([112, 112],false,true)
  input_data2 = tf.transpose(input_data2, [2, 0, 1])
  input_data2 = input_data2.expandDims()
  input_data2 = input_data2.div(255).sub(0.5).div(0.5)
  const tensor2 = tf.round(tf.mul(input_data2, 10000)).div(10000);

  const [result11, result22] = await Promise.all([fetchData(tensor1), fetchData(tensor2)])

  const normalizedOuts = l2Norm(result11).squeeze()
  const normalizedOuts2 = l2Norm(result22).squeeze()
  const score = cosSim(normalizedOuts, normalizedOuts2)
  return score
}

async function initModel() {
  model = await tf.loadGraphModel('./model/face_verify/model.json')
}

async function toTensor(image) {
  // 将图像绘制到画布上
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  // fromPixel 将画布数据转换为张量
   let input_data = tf.browser.fromPixels(canvas)
  // 张量预处理
  input_data = input_data.resizeBilinear([112, 112],false,true)
  input_data = tf.transpose(input_data, [2, 0, 1])
  input_data = input_data.expandDims()
  input_data = input_data.div(255).sub(0.5).div(0.5)

  const y = tf.round(tf.mul(input_data, 10000)).div(10000);

  return y
}

async function doInference(element, ele2, callback) {
  const elementType = element.nodeName
  const ele2Type = ele2.nodeName
  
  if (ele2Type !== 'IMG') {
    alert('请输入正确的基准图片')
    return
  }

  if (elementType === 'VIDEO') {
    const videoWidth = element.videoWidth;
    const videoHeight = element.videoHeight;
    // Must set below two lines, otherwise video element doesn't show.
    element.width = videoWidth;
    element.height = videoHeight;

	  interval = setInterval(async () => {
      const score = await getScore(element, ele2)
      callback(score)
    }, analysis_gap)

  } else {
    const score = await getScore(element, ele2)
    callback(score)
  }
}

const app = async (element, ele2, userId, code, callback, frecnt = 500) => {
  analysis_gap = frecnt
	
  if (!code.endsWith('==') || code[code.length - 3] === '=') {
    alert('授权码错误')
    return
  }

  const decryptData = JSON.parse(decrypt(code))

  const currentDate = new Date(Date.now())
  const startDate = new Date(decryptData.start)
  const endDate = new Date(decryptData.end)

  if (decryptData.callerNo !== userId) {
    alert('用户权限错误')
    return
  } 
  else if (currentDate < startDate || currentDate > endDate) {
    alert('授权码错误')
    return
  }
  await initModel()
  await doInference(element, ele2, callback)
}

export default app

