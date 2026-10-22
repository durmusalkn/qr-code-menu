package expo.modules.timelapseencoder

import android.graphics.Bitmap
import android.media.Image

/**
 * A frame in planar YUV 4:2:0 (BT.601, limited range), converted once per photo and then copied
 * into the encoder's input [Image] as many times as the photo is held on screen.
 */
class Yuv420Frame(val width: Int, val height: Int) {
  private val chromaWidth = width / 2
  private val chromaHeight = height / 2
  private val argb = IntArray(width * height)

  val y = ByteArray(width * height)
  val u = ByteArray(chromaWidth * chromaHeight)
  val v = ByteArray(chromaWidth * chromaHeight)

  fun fillFrom(bitmap: Bitmap) {
    bitmap.getPixels(argb, 0, width, 0, 0, width, height)
    fillFrom(argb)
  }

  fun fillFrom(pixels: IntArray) {
    for (i in 0 until width * height) {
      val c = pixels[i]
      val r = (c shr 16) and 0xFF
      val g = (c shr 8) and 0xFF
      val b = c and 0xFF
      y[i] = (((66 * r + 129 * g + 25 * b + 128) shr 8) + 16).toByte()
    }
    // Each chroma sample is the average of a 2x2 block of pixels.
    for (cy in 0 until chromaHeight) {
      for (cx in 0 until chromaWidth) {
        var r = 0
        var g = 0
        var b = 0
        for (dy in 0..1) {
          val row = (cy * 2 + dy) * width
          for (dx in 0..1) {
            val c = pixels[row + cx * 2 + dx]
            r += (c shr 16) and 0xFF
            g += (c shr 8) and 0xFF
            b += c and 0xFF
          }
        }
        r /= 4
        g /= 4
        b /= 4
        val i = cy * chromaWidth + cx
        u[i] = (((-38 * r - 74 * g + 112 * b + 128) shr 8) + 128).toByte()
        v[i] = (((112 * r - 94 * g - 18 * b + 128) shr 8) + 128).toByte()
      }
    }
  }

  /** Copies the planes into an encoder input image, honoring its row and pixel strides. */
  fun copyInto(image: Image) {
    val planes = image.planes
    copyPlane(y, width, height, planes[0])
    copyPlane(u, chromaWidth, chromaHeight, planes[1])
    copyPlane(v, chromaWidth, chromaHeight, planes[2])
  }

  private fun copyPlane(src: ByteArray, planeWidth: Int, planeHeight: Int, plane: Image.Plane) {
    val buffer = plane.buffer
    val rowStride = plane.rowStride
    val pixelStride = plane.pixelStride
    for (row in 0 until planeHeight) {
      val srcOffset = row * planeWidth
      val dstOffset = row * rowStride
      if (pixelStride == 1) {
        buffer.position(dstOffset)
        buffer.put(src, srcOffset, planeWidth)
      } else {
        for (col in 0 until planeWidth) {
          buffer.put(dstOffset + col * pixelStride, src[srcOffset + col])
        }
      }
    }
  }
}
