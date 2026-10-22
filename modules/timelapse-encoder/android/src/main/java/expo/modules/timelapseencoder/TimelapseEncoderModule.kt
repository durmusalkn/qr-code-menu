package expo.modules.timelapseencoder

import android.net.Uri
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

class FrameSpec : Record {
  @Field
  val uri: String = ""

  @Field
  val label: String? = null
}

class EncodeOptions : Record {
  @Field
  val frames: List<FrameSpec> = emptyList()

  @Field
  val outputUri: String = ""

  @Field
  val width: Int = 1080

  @Field
  val height: Int = 1920

  @Field
  val fps: Int = 30

  @Field
  val secondsPerPhoto: Double = 0.4

  @Field
  val bitRate: Int = 8_000_000
}

class TimelapseEncoderModule : Module() {
  private val cancelled = AtomicBoolean(false)
  private val running = AtomicBoolean(false)

  override fun definition() = ModuleDefinition {
    Name("TimelapseEncoder")

    Events("onProgress")

    AsyncFunction("encodeAsync") Coroutine { options: EncodeOptions ->
      if (options.frames.isEmpty()) throw CodedException("ERR_NO_FRAMES", "Video için en az bir fotoğraf gerekli", null)
      if (!running.compareAndSet(false, true)) throw CodedException("ERR_BUSY", "Zaten bir video oluşturuluyor", null)
      cancelled.set(false)
      try {
        val outputPath = toPath(options.outputUri)
        withContext(Dispatchers.Default) {
          TimelapseWriter(
            width = options.width,
            height = options.height,
            fps = options.fps,
            framesPerPhoto = TimelapseWriter.framesPerPhoto(options.secondsPerPhoto, options.fps),
            bitRate = options.bitRate,
            cancelled = cancelled,
            onProgress = { current, total ->
              sendEvent("onProgress", mapOf("current" to current, "total" to total))
            }
          ).write(options.frames.map { TimelapseFrame(toPath(it.uri), it.label) }, outputPath)
        }
        Uri.fromFile(java.io.File(outputPath)).toString()
      } catch (e: TimelapseCancelledException) {
        throw CodedException("ERR_CANCELLED", e.message, e)
      } finally {
        running.set(false)
      }
    }

    Function("cancel") {
      cancelled.set(true)
    }
  }

  private fun toPath(uriOrPath: String): String =
    if (uriOrPath.startsWith("file://")) Uri.parse(uriOrPath).path ?: uriOrPath else uriOrPath
}
