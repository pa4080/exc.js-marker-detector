class MarkerDetector {
  constructor({ debug = false } = {}) {
    this.debug = debug;

    if (this.debug) {
      this.debugCanvas = document.createElement("canvas");
      this.debugCtx = this.debugCanvas.getContext("2d");
      document.body.appendChild(this.debugCanvas);
    }
  }

  /**
   * Remember each group of 4 members of the data array represents on pixel,
   * so we are going to iterate over the array pixel by pixel.
   * > const opacity = imageData.data[i + 3];
   */
  detect(imageData) {
    const points = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i + 0];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Measure the blueness
      const blueness = b - Math.max(r, g);

      if (blueness > 20) {
        // https://youtu.be/jy-Mxbt0zww?si=Vq3R15B0S9uZQSrz&t=1049
        const pixelIndex = i / 4;
        const pixelY = Math.floor(pixelIndex / imageData.width);
        const pixelX = pixelIndex % imageData.width;
        points.push({ x: pixelX, y: pixelY, blueness });
      }
    }

    if (this.debug) {
      // Display only the blue points, https://youtu.be/jy-Mxbt0zww?si=AMdO_Umd8mtuK99_
      this.debugCanvas.width = imageData.width;
      this.debugCanvas.height = imageData.height + 255; // +255 is the space for the chart

      for (const point of points) {
        this.debugCtx.globalAlpha = point.blueness / 255;
        this.debugCtx.fillRect(point.x, point.y, 1, 1);
      }

      // Display the chart, https://youtu.be/jy-Mxbt0zww?si=RYCnCRN_aICj_eYh&t=1415
      this.debugCtx.globalAlpha = 1;
      this.debugCtx.strokeStyle = "red";
      this.debugCtx.translate(0, imageData.height); // Move the chart to the bottom and start drawing point in the +255 area

      points.sort((a, b) => b.blueness - a.blueness);

      for (let i = 0; i < points.length; i++) {
        const y = points[i].blueness;
        const x = (this.debugCanvas.width * i) / points.length;
        this.debugCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}
