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

  #distance(p1, p2) {
    // Use the Pythagorean theorem (find the hypotenuse)
    // to get the distance between two points
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
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

    // Divide the points into two groups, https://youtu.be/jy-Mxbt0zww?si=VaB9UTIGYc_EWkaj&t=2000
    const point_first = points[0];
    const point_last = points[points.length - 1];

    const group_1 = points.filter((p) => this.#distance(p, point_first) < this.#distance(p, point_last));
    const centroid_1 = this.#averagePoints(group_1);
    const size_1 = Math.sqrt(group_1.length);
    const radius_1 = size_1 / 2;

    const group_2 = points.filter((p) => this.#distance(p, point_first) > this.#distance(p, point_last));
    const centroid_2 = this.#averagePoints(group_2);
    const size_2 = Math.sqrt(group_2.length);
    const radius_2 = size_2 / 2;

    if (this.debug) {
      // Display only the blue points, https://youtu.be/jy-Mxbt0zww?si=AMdO_Umd8mtuK99_
      this.debugCanvas.width = imageData.width;
      this.debugCanvas.height = imageData.height + 255; // +255 is the space for the chart

      this.debugCtx.fillStyle = "red";
      for (const point of group_1) {
        this.debugCtx.globalAlpha = point.blueness / 255;
        this.debugCtx.fillRect(point.x, point.y, 1, 1);
      }

      this.debugCtx.fillStyle = "orange";
      for (const point of group_2) {
        this.debugCtx.globalAlpha = point.blueness / 255;
        this.debugCtx.fillRect(point.x, point.y, 1, 1);
      }

      // Reset the global alpha, for the next graphs
      this.debugCtx.fillStyle = "gray";
      this.debugCtx.globalAlpha = 1;

      // Display the centroid, https://youtu.be/jy-Mxbt0zww?si=l295VqvCEsSzNQpA&t=1807
      this.debugCtx.beginPath();
      this.debugCtx.arc(centroid_1.x, centroid_1.y, radius_1, 0, Math.PI * 2);
      this.debugCtx.stroke();

      this.debugCtx.beginPath();
      this.debugCtx.arc(centroid_2.x, centroid_2.y, radius_2, 0, Math.PI * 2);
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
