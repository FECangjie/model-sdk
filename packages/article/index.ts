// import * as ort from "onnxruntime-web";
// const ort = require('onnxruntime-web');
// import * as inkjet from "inkjet";
console.log(ort);
const modelHeight = 640;
const modelWidth = 640;
const modelChannel = 3;

const CLS_CONF_IDX = 4;
const YOLOV5S_BOXES = 25200;
const YOLOV5S_CLASSES = 7; // 4box 1score 2classprob
const PICK_CONF_THRES = 0.25;
const IOU_THRES = 0.45;
const MAX_WH = 7680;

//# !! input a 640x640 image, output a 640x640 image
function preProcess(frame, dstInput) {
  //console.log('Uint8', frame.data);
  const origData = new Uint8Array(frame.data);
  const hRatio = 1;
  const wRatio = 1;

  // resize data to model input size, uint8 data to float32 data,
  // and transpose from nhwc to nchw
  // !!!
  const origHStride = frame.width * 4;
  const origWStride = 4;
  var idx = 0;
  for (var c = 0; c < modelChannel; ++c) {
    for (var h = 0; h < modelHeight; ++h) {
      const origH = Math.round(h * hRatio);
      const origHOffset = origH * origHStride;

      for (var w = 0; w < modelWidth; ++w) {
        const origW = Math.round(w * wRatio);

        const origIndex = origHOffset + origW * origWStride + c;

        var val = origData[origIndex] / 255.0;
        dstInput[idx] = val;

        idx++;
      }
    }
  }
}

function xywh2xyxy(cx, cy, width, height) {
  const left = Math.round(cx - width / 2.0);
  const right = Math.round(cx + width / 2.0);
  const top = Math.round(cy - height / 2.0);
  const bottom = Math.round(cy + height / 2.0);
  return [left, right, top, bottom];
}

function iou(cx1, cy1, w1, h1, cx2, cy2, w2, h2) {
  let [left1, right1, top1, bottom1] = xywh2xyxy(cx1, cy1, w1, h1);
  const area1 = w1 * h1;

  let [left2, right2, top2, bottom2] = xywh2xyxy(cx2, cy2, w2, h2);
  const area2 = w2 * h2;

  /* interaction */
  const ll = Math.max(left1, left2);
  const rr = Math.min(right1, right2);
  const tt = Math.max(top1, top2);
  const bb = Math.min(bottom1, bottom2);

  const iw = Math.max(0, rr - ll);
  const ih = Math.max(0, bb - tt);
  const intersection_area = iw * ih;

  const union_area = area1 + area2 - intersection_area;
  return intersection_area / union_area;
}

function non_max_suppression(input, orig_height, orig_width) {
  var candidates: any = [];

  for (var idx = 0; idx < YOLOV5S_BOXES; idx++) {
    var arr = input.subarray(
      idx * YOLOV5S_CLASSES,
      (idx + 1) * YOLOV5S_CLASSES
    );

    // console.log(idx, arr)
    if (arr[CLS_CONF_IDX] > PICK_CONF_THRES) {
      let max_cls_conf = 0;
      let max_cls = 0;
      for (var jdx = 5; jdx < YOLOV5S_CLASSES; jdx++) {
        if (arr[jdx] > max_cls_conf) {
          max_cls_conf = arr[jdx];
          max_cls = jdx - 5;
        }
      }
      const score = arr[CLS_CONF_IDX] * max_cls_conf;
      if (score > PICK_CONF_THRES) {
        var offset =
          MAX_WH *
          max_cls; /* we need this to put boxes of different classes to different space */
        candidates.push([
          arr[0] + offset,
          arr[1] + offset,
          arr[2],
          arr[3],
          score,
          max_cls,
        ]);
      }
    }
  }
  console.log("candidates:", candidates);
  /* use Non Max Suppression to get 'selected' */
  candidates = candidates.sort(
    (a, b) => b[CLS_CONF_IDX] - a[CLS_CONF_IDX]
  ); /* sort by score */
  var selected: any = [];
  candidates.forEach((cand) => {
    let add = true;
    for (var idx = 0; idx < selected.length; idx++) {
      const val = iou(
        cand[0],
        cand[1],
        cand[2],
        cand[3],
        selected[idx][0],
        selected[idx][1],
        selected[idx][2],
        selected[idx][3]
      );
      if (val > IOU_THRES) {
        add = false;
      }
    }

    if (add) {
      selected.push(cand);
    }
  });

  /* get simplified output from 'selected' */
  var wratio = orig_width / modelWidth;
  var hratio = orig_height / modelHeight;
  var answer: any = [];
  selected.forEach((sel) => {
    var offset = MAX_WH * sel[5];
    let [x1, x2, y1, y2] = xywh2xyxy(
      Math.round(sel[0]) - offset,
      Math.round(sel[1]) - offset,
      Math.round(sel[2]),
      Math.round(sel[3])
    );
    x1 = Math.round(x1 * wratio);
    x2 = Math.round(x2 * wratio);
    y1 = Math.round(y1 * hratio);
    y2 = Math.round(y2 * hratio);
    answer.push([x1, x2, y1, y2, sel[4], sel[5]]);
  });

  /* write answer to txt file */
  let content = "";
  answer.forEach((item) => {
    content += "[" + item.toString() + "]\n";
  });
  // fs.writeFileSync("./lib/output.txt", content);
}

function readImgHandle(decoded) {
  if (decoded != undefined) {
    const modelInput = new Float32Array(modelHeight * modelWidth * 3);
    //TODO: check the decode, asserts it is 640x640.
    console.log(decoded.height, decoded.width);
    console.assert(decoded.height === 640, "bad height, expect 640");
    console.assert(decoded.width === 640, "bad width, expect 640");
    //console.log('before', decoded);//checked correct when size of image is 640x640
    preProcess(decoded, modelInput);
    //console.log('after', modelInput, modelInput); // checked correct when size of iamge is 640x640
    console.log("3");

    const tensor = new ort.Tensor("float32", modelInput, [
      1,
      3,
      modelHeight,
      modelWidth,
    ]);
    ort.InferenceSession.create("./lib/nano.onnx").then((se) => {
      console.log("4");
      se.run({ input: tensor }).then((res) => {
        console.log("5");
        // console.log('output', res.output)
        non_max_suppression(res.output.data, decoded.height, decoded.width);
      });
    });
  }
}

window.loadImage = () => {
  console.log("启动物品模型");
  const img = document.getElementById("myImg");
  //   let canvas = document.getElementById("myCanvas");
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = modelWidth;
  canvas.height = modelHeight;
  ctx?.drawImage(img, 0, 0, img.width, img.height);
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var base64String = canvas.toDataURL("image/png");

  //   dom?.innerHTML = canvas;
  readImgHandle(imageData);
  var base64Content = base64String.split(",")[1];
  // inkjet.decode(fs.readFileSync(process.argv[2]),
};
// loadImage();
