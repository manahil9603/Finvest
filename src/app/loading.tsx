import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

/** Shown while a route segment streams — same dim + center spinner as client navigation. */
export default function Loading() {
  return <LoadingOverlay active={true} />
}
