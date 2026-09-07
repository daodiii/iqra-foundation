/** Phones get 720p; WebM (VP9) is preferred wherever it plays. */
export function pickSource({ narrow, webm }: { narrow: boolean; webm: boolean }): string {
  return `/media/iqra-loop-${narrow ? 720 : 1080}.${webm ? 'webm' : 'mp4'}`;
}
