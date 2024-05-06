class MarkerDetector {
  constructor({ debug = false } = {}) {
    this.debug = debug;

    this.threshold = document.createElement("input");
    this.threshold.type = "range";
    this.threshold.min = 0;
    this.threshold.max = 255;
    this.threshold.value = 35;
    document.body.appendChild(this.threshold);

    this.thresholdDisplay = document.createElement("span");
    this.thresholdDisplay.textContent = this.threshold.value;
    this.thresholdDisplay.style.marginLeft = "8px";
    document.body.appendChild(this.thresholdDisplay);

    if (this.debug) {
      this.debugCanvas = document.createElement("canvas");
      this.debugCtx = this.debugCanvas.getContext("2d");
      document.body.appendChild(this.debugCanvas);
    }
  }

  #averagePoints(points) {
    const center = { x: 0, y: 0 };

    for (const point of points) {
      center.x += point.x;
      center.y += point.y;
    }

    center.x /= points.length;
    center.y /= points.length;

    return center;
  }

  /**
   * Remember each group of 4 members of the data array represents on pixel,
   * so we are going to iterate over the array pixel by pixel.
   * > const opacity = imageData.data[i + 3];
   */
  detect(imageData) {
    const points = [];
    this.threshold.style.width = `${imageData.width - 32}px`;
    this.thresholdDisplay.textContent = this.threshold.value;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i + 0];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Measure the blueness
      const blueness = b - Math.max(r, g);

      if (blueness > this.threshold.value) {
        // https://youtu.be/jy-Mxbt0zww?si=Vq3R15B0S9uZQSrz&t=1049
        const pixelIndex = i / 4;
        const pixelY = Math.floor(pixelIndex / imageData.width);
        const pixelX = pixelIndex % imageData.width;
        points.push({ x: pixelX, y: pixelY, blueness });
      }
    }

    const centroid = this.#averagePoints(points);

    if (this.debug) {
      // Display only the blue points, https://youtu.be/jy-Mxbt0zww?si=AMdO_Umd8mtuK99_
      this.debugCanvas.width = imageData.width;
      this.debugCanvas.height = imageData.height + 255; // +255 is the space for the chart

      for (const point of points) {
        this.debugCtx.globalAlpha = point.blueness / 255;
        this.debugCtx.fillRect(point.x, point.y, 1, 1);
      }

      // Reset the global alpha, for the next graphs
      this.debugCtx.globalAlpha = 1;

      // Display the centroid, https://youtu.be/jy-Mxbt0zww?si=l295VqvCEsSzNQpA&t=1807
      this.debugCtx.beginPath();
      this.debugCtx.arc(centroid.x, centroid.y, 100, 0, Math.PI * 2);
      this.debugCtx.stroke();

      // Display the chart, https://youtu.be/jy-Mxbt0zww?si=RYCnCRN_aICj_eYh&t=1415
      this.debugCtx.translate(0, imageData.height); // Move the chart to the bottom and start drawing point in the +255 area

      // Draw horizontal line
      this.debugCtx.beginPath();
      this.debugCtx.moveTo(0, 0);
      this.debugCtx.lineTo(this.debugCanvas.width, 0);
      this.debugCtx.strokeStyle = "gray";
      this.debugCtx.lineWidth = 2;
      this.debugCtx.stroke();

      // Display the chart, https://youtu.be/jy-Mxbt0zww?si=RYCnCRN_aICj_eYh&t=1415
      points.sort((a, b) => b.blueness - a.blueness);

      for (let i = 0; i < points.length; i++) {
        const y = points[i].blueness;
        const x = (this.debugCanvas.width * i) / points.length;
        this.debugCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}
