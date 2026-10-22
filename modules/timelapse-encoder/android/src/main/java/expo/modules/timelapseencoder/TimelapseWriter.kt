package expo.modules.timelapseencoder

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.media.ExifInterface
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class TimelapseFrame(val path: String, val label: String?)

class TimelapseCancelledException : Exception("Video oluşturma iptal edildi")

/**
 * Turns a list of photos into an H.264 MP4 using MediaCodec + MediaMuxer, fully on-device.
 *
 * Every photo is letterboxed onto a black [width]x[height] canvas (respecting EXIF rotation),
 * an optional label is drawn at the bottom, and the result is held for [framesPerPhoto] frames.
 */
class TimelapseWriter(
  private val width: Int,
  private val height: Int,
  private val fps: Int,
  private val framesPerPhoto: Int,
  private val bitRate: Int,
  private val cancelled: AtomicBoolean,
  private val onProgress: (current: Int, total: Int) -> Unit
) {
  private val frameDurationUs = 1_000_000L / fps
  private val bufferInfo = MediaCodec.BufferInfo()

  private lateinit var codec: MediaCodec
  private lateinit var muxer: MediaMuxer
  private var trackIndex = -1
  private var muxerStarted = false
  private var frameIndex = 0L

  fun write(frames: List<TimelapseFrame>, outputPath: String) {
    require(frames.isNotEmpty()) { "En az bir fotoğraf gerekli" }
    require(width % 2 == 0 && height % 2 == 0) { "Genişlik ve yükseklik çift sayı olmalı" }

    File(outputPath).parentFile?.mkdirs()
    val format = MediaFormat.createVideoFormat(MIME_TYPE, width, height).apply {
      setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible)
      setInteger(MediaFormat.KEY_BIT_RATE, bitRate)
      setInteger(MediaFormat.KEY_FRAME_RATE, fps)
      setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
    }
    codec = MediaCodec.createEncoderByType(MIME_TYPE)
    var success = false
    try {
      codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      codec.start()
      muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

      val canvasBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val yuv = Yuv420Frame(width, height)
      try {
        frames.forEachIndexed { index, frame ->
          if (cancelled.get()) throw TimelapseCancelledException()
          renderFrame(frame, canvasBitmap)
          yuv.fillFrom(canvasBitmap)
          repeat(framesPerPhoto) { queueFrame(yuv) }
          onProgress(index + 1, frames.size)
        }
      } finally {
        canvasBitmap.recycle()
      }
      signalEndOfStream()
      success = true
    } finally {
      release()
      if (!success) File(outputPath).delete()
    }
  }

  private fun renderFrame(frame: TimelapseFrame, target: Bitmap) {
    val canvas = Canvas(target)
    canvas.drawColor(Color.BLACK)

    val photo = loadPhoto(frame.path)
    if (photo != null) {
      val scale = min(width.toFloat() / photo.width, height.toFloat() / photo.height)
      val drawW = photo.width * scale
      val drawH = photo.height * scale
      val left = (width - drawW) / 2f
      val top = (height - drawH) / 2f
      val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
      canvas.drawBitmap(photo, null, RectF(left, top, left + drawW, top + drawH), paint)
      photo.recycle()
    }

    if (!frame.label.isNullOrBlank()) drawLabel(canvas, frame.label)
  }

  private fun drawLabel(canvas: Canvas, label: String) {
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      textSize = width * 0.045f
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
      textAlign = Paint.Align.CENTER
    }
    val padH = textPaint.textSize * 0.8f
    val padV = textPaint.textSize * 0.45f
    val textWidth = textPaint.measureText(label)
    val metrics = textPaint.fontMetrics
    val textHeight = metrics.descent - metrics.ascent
    val centerX = width / 2f
    val bottom = height - height * 0.06f
    val box = RectF(
      centerX - textWidth / 2f - padH,
      bottom - textHeight - padV * 2,
      centerX + textWidth / 2f + padH,
      bottom
    )
    val boxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(150, 0, 0, 0) }
    val radius = box.height() / 2f
    canvas.drawRoundRect(box, radius, radius, boxPaint)
    canvas.drawText(label, centerX, box.top + padV - metrics.ascent, textPaint)
  }

  /** Decodes a photo downsampled to roughly the output size, rotated according to its EXIF data. */
  private fun loadPhoto(path: String): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, bounds)
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

    val rotation = readRotation(path)
    val (srcW, srcH) = if (rotation % 180 == 0) bounds.outWidth to bounds.outHeight else bounds.outHeight to bounds.outWidth
    var sampleSize = 1
    while (srcW / (sampleSize * 2) >= width && srcH / (sampleSize * 2) >= height) sampleSize *= 2

    val decoded = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sampleSize }) ?: return null
    if (rotation == 0) return decoded
    val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
    val rotated = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
    if (rotated !== decoded) decoded.recycle()
    return rotated
  }

  private fun readRotation(path: String): Int = try {
    when (ExifInterface(path).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
      ExifInterface.ORIENTATION_ROTATE_90 -> 90
      ExifInterface.ORIENTATION_ROTATE_180 -> 180
      ExifInterface.ORIENTATION_ROTATE_270 -> 270
      else -> 0
    }
  } catch (e: Exception) {
    0
  }

  private fun queueFrame(yuv: Yuv420Frame) {
    val inputIndex = dequeueInputBuffer()
    val image = codec.getInputImage(inputIndex) ?: throw IllegalStateException("Encoder giriş görüntüsü alınamadı")
    yuv.copyInto(image)
    val ptsUs = frameIndex * frameDurationUs
    codec.queueInputBuffer(inputIndex, 0, width * height * 3 / 2, ptsUs, 0)
    frameIndex++
    drainEncoder(endOfStream = false)
  }

  private fun signalEndOfStream() {
    val inputIndex = dequeueInputBuffer()
    codec.queueInputBuffer(inputIndex, 0, 0, frameIndex * frameDurationUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
    drainEncoder(endOfStream = true)
  }

  private fun dequeueInputBuffer(): Int {
    while (true) {
      if (cancelled.get()) throw TimelapseCancelledException()
      val index = codec.dequeueInputBuffer(TIMEOUT_US)
      if (index >= 0) return index
      // Encoder is busy: free up space by consuming whatever output is ready.
      drainEncoder(endOfStream = false)
    }
  }

  private fun drainEncoder(endOfStream: Boolean) {
    while (true) {
      val index = codec.dequeueOutputBuffer(bufferInfo, if (endOfStream) TIMEOUT_US else 0L)
      when {
        index == MediaCodec.INFO_TRY_AGAIN_LATER -> if (!endOfStream) return
        index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
          check(!muxerStarted) { "Encoder çıkış formatı birden fazla kez değişti" }
          trackIndex = muxer.addTrack(codec.outputFormat)
          muxer.start()
          muxerStarted = true
        }
        index >= 0 -> {
          val buffer = codec.getOutputBuffer(index) ?: throw IllegalStateException("Encoder çıkış tamponu boş")
          if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) {
            // Codec config (SPS/PPS) is already part of the track format given to the muxer.
            bufferInfo.size = 0
          }
          if (bufferInfo.size > 0 && muxerStarted) {
            buffer.position(bufferInfo.offset)
            buffer.limit(bufferInfo.offset + bufferInfo.size)
            muxer.writeSampleData(trackIndex, buffer, bufferInfo)
          }
          codec.releaseOutputBuffer(index, false)
          if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
        }
      }
    }
  }

  private fun release() {
    try {
      codec.stop()
    } catch (_: Exception) {
    }
    codec.release()
    if (::muxer.isInitialized) {
      try {
        if (muxerStarted) muxer.stop()
      } catch (_: Exception) {
      }
      muxer.release()
    }
  }

  companion object {
    private const val MIME_TYPE = MediaFormat.MIMETYPE_VIDEO_AVC
    private const val TIMEOUT_US = 10_000L

    fun framesPerPhoto(secondsPerPhoto: Double, fps: Int): Int = max(1, (secondsPerPhoto * fps).roundToInt())
  }
}
