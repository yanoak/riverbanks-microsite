// Decode the first frame of a video with AVFoundation, the decoder Safari uses, and report how
// much of it is transparent. A file that fails here fails in Safari with "Media failed to
// decode". Usage: swiftc -O check-alpha.swift -o /tmp/check-alpha && /tmp/check-alpha FILE
import AVFoundation
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let asset = AVURLAsset(url: url)
let sem = DispatchSemaphore(value: 0)
Task {
  do {
    let tracks = try await asset.loadTracks(withMediaType: .video)
    guard let track = tracks.first else { print("no video track"); sem.signal(); return }
    let playable = try await asset.load(.isPlayable)
    let fmts = try await track.load(.formatDescriptions)
    for f in fmts {
      let ext = CMFormatDescriptionGetExtensions(f) as? [String: Any] ?? [:]
      print("codec", FourCharCode(CMFormatDescriptionGetMediaSubType(f)), "playable", playable, "alpha-ext keys:", ext.keys.filter { $0.lowercased().contains("alpha") })
    }
    let reader = try AVAssetReader(asset: asset)
    let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    reader.add(out)
    guard reader.startReading() else { print("reader failed", reader.error as Any); sem.signal(); return }
    guard let sample = out.copyNextSampleBuffer(), let pb = CMSampleBufferGetImageBuffer(sample) else { print("no frame", reader.error as Any); sem.signal(); return }
    CVPixelBufferLockBaseAddress(pb, .readOnly)
    let w = CVPixelBufferGetWidth(pb), h = CVPixelBufferGetHeight(pb), bpr = CVPixelBufferGetBytesPerRow(pb)
    let base = CVPixelBufferGetBaseAddress(pb)!.assumingMemoryBound(to: UInt8.self)
    var clear = 0
    for y in 0..<h { for x in 0..<w { if base[y*bpr + x*4 + 3] < 10 { clear += 1 } } }
    print(String(format: "frame %dx%d, transparent px %.0f%%", w, h, 100.0*Double(clear)/Double(w*h)))
  } catch { print("error", error) }
  sem.signal()
}
sem.wait()
