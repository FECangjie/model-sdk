import cv2
import sys

import matplotlib.pyplot as plt

names = ['book', 'mobile_phone']

if __name__ == "__main__":
    img = cv2.imread(sys.argv[1])
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    with open("./output.txt", "r") as fp:
        lines = fp.readlines()
        for line in lines:
            x1, x2, y1, y2, score, cls_index = eval(line)
            img = cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
            img = cv2.putText(img, names[cls_index] + f" {int(score*100)}%", (x1, y1), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
    plot = plt.imshow(img)
    plt.show()
    cv2.imwrite('output.jpg', img)
